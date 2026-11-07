// Voice Engine for VISP: Real-Time STT, TTS, VAD, Barge-in & Interruption

export interface VoiceEngineEvents {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioLevel: (level: number) => void; // 0.0 to 1.0 for visual waveform
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onStateChange: (state: 'idle' | 'listening' | 'speaking' | 'muted') => void;
  onError: (error: string) => void;
}

export class VoiceEngine {
  private recognition: any = null;
  private isListening = false;
  private isSpeaking = false;
  private isMuted = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneStream: MediaStream | null = null;
  private animFrameId: number | null = null;
  private events: VoiceEngineEvents;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private bargeInEnabled = true;

  constructor(events: VoiceEngineEvents) {
    this.events = events;
    this.initSpeechRecognition();
  }

  private initSpeechRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not natively supported in this webview environment');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        this.events.onStateChange('listening');
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        // Barge-in: If the user starts speaking while VISP is speaking, immediately interrupt!
        if (this.isSpeaking && this.bargeInEnabled && (interimTranscript.length > 2 || finalTranscript.length > 2)) {
          this.interrupt();
        }

        if (finalTranscript) {
          this.events.onTranscript(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.events.onTranscript(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
          this.events.onError(`Voice recognition: ${event.error}`);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if hands-free is enabled and not manually stopped or muted
        if (this.isListening && !this.isMuted) {
          try {
            this.recognition.start();
          } catch {
            // Already active or busy
          }
        }
      };
    } catch (e: any) {
      console.error('Failed to initialize speech recognition', e);
    }
  }

  /**
   * Start microphone input and WebAudio VAD meter
   */
  async startListening(): Promise<boolean> {
    if (this.isMuted) return false;

    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      if (!this.microphoneStream) {
        this.microphoneStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      }

      const source = this.audioContext.createMediaStreamSource(this.microphoneStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      this.startVADLoop();

      if (this.recognition) {
        try {
          this.recognition.start();
        } catch {
          // May already be started
        }
      }

      this.isListening = true;
      this.events.onStateChange('listening');
      return true;
    } catch (err: any) {
      console.error('Failed to access microphone', err);
      this.events.onError(`Microphone access error: ${err.message || 'Permission denied'}`);
      return false;
    }
  }

  /**
   * Continuous VAD and Audio Waveform level measurement
   */
  private startVADLoop() {
    if (!this.analyser) return;

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    const updateMeter = () => {
      if (!this.isListening) return;

      this.analyser!.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(1.0, average / 128); // 0.0 - 1.0

      this.events.onAudioLevel(normalized);

      // Barge-in voice activity detection:
      if (normalized > 0.25 && this.isSpeaking && this.bargeInEnabled) {
        this.interrupt();
      }

      this.animFrameId = requestAnimationFrame(updateMeter);
    };

    updateMeter();
  }

  /**
   * Stop listening
   */
  stopListening() {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Recognition might not be running
      }
    }
    this.events.onAudioLevel(0);
    this.events.onStateChange('idle');
  }

  /**
   * Interrupt current speech immediately (Barge-in)
   */
  interrupt() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
    this.events.onSpeechEnd();
    if (this.isListening) {
      this.events.onStateChange('listening');
    } else {
      this.events.onStateChange('idle');
    }
  }

  /**
   * Speak text naturally using Web Speech Synthesis
   */
  speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceName?: string;
      onEnd?: () => void;
    }
  ) {
    if (!window.speechSynthesis || this.isMuted) {
      options?.onEnd?.();
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Strip markdown formatting symbols for natural spoken text
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_#~]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      options?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = options?.rate ?? 1.05;
    utterance.pitch = options?.pitch ?? 1.0;

    // Pick best natural voice available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred =
        voices.find((v) => v.name.includes('Natural') || v.name.includes('Neural')) ||
        voices.find((v) => v.name.includes('Google') || v.name.includes('Microsoft')) ||
        voices[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.events.onSpeechStart();
      this.events.onStateChange('speaking');
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.events.onSpeechEnd();
      if (this.isListening) {
        this.events.onStateChange('listening');
      } else {
        this.events.onStateChange('idle');
      }
      options?.onEnd?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.events.onSpeechEnd();
      if (this.isListening) {
        this.events.onStateChange('listening');
      }
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Toggle mute
   */
  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.interrupt();
      this.stopListening();
      this.events.onStateChange('muted');
    } else {
      this.events.onStateChange('idle');
    }
  }

  setBargeInEnabled(enabled: boolean) {
    this.bargeInEnabled = enabled;
  }

  getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  destroy() {
    this.stopListening();
    this.interrupt();
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach((t) => t.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
