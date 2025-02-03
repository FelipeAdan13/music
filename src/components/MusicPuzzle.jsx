import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";
import { Loader2 } from "lucide-react";
import victoryMusicFile from "../assets/also-sprach-zarathustra.ogg";
import videoFile from "../assets/Felipe_Adan_Gomes_A_captivating_cinematic_portrayal_of_a_colossal,_a_13930ba3-4b51-46a9-8616-22a518e2ee30.mp4";

const MusicPuzzle = () => {
  const [sequence, setSequence] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const victoryMusic = useRef(null);
  const videoRef = useRef(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const [attempts, setAttempts] = useState(0);
  const [revealedClues, setRevealedClues] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const correctSequence = ["C", "G", "C"];

  const visualClues = [
    {
      symbol: "○●○",
      text: "O ciclo é infinito, início meio e fim, repetindo-se em padrões perpétuos",
      threshold: 2,
    },
    {
      symbol: "↑↑↑",
      text: "A melodia, com seus padrões hipnóticos, traz ordem ao caos da existência",
      threshold: 4,
    },
    {
      symbol: "C✧G",
      text: "As notas primordiais ecoam através do tempo",
      threshold: 6,
    },
  ];

  const notes = [
    { key: "C", freq: 261.63, color: "bg-blue-500", symbol: "◯" },
    { key: "D", freq: 293.66, color: "bg-indigo-500", symbol: "△" },
    { key: "E", freq: 329.63, color: "bg-purple-500", symbol: "□" },
    { key: "F", freq: 349.23, color: "bg-red-500", symbol: "⬡" },
    { key: "G", freq: 392.0, color: "bg-green-500", symbol: "◇" },
    { key: "A", freq: 440.0, color: "bg-yellow-500", symbol: "▽" },
    { key: "B", freq: 493.88, color: "bg-orange-500", symbol: "⬢" },
  ];

  useEffect(() => {
    // Initialize audio context and victory music
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      setAudioContext(context);

      const audio = new Audio(victoryMusicFile);
      audio.loop = true;
      audio.volume = 0.7;
      victoryMusic.current = audio;

      // Cleanup function
      return () => {
        const audio = victoryMusic.current;
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
        if (context && context.state !== "closed") {
          context.close();
        }
      };
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  }, []);

  // Função para tocar uma nota
  const playNote = useCallback(
    async (frequency) => {
      if (!audioContext) return;

      // Resume AudioContext if it's suspended
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    },
    [audioContext]
  );

  const playVictoryMusic = useCallback(async () => {
    try {
      // Resume AudioContext if it's suspended
      if (audioContext?.state === "suspended") {
        await audioContext.resume();
      }

      const audio = victoryMusic.current;
      audio.currentTime = 0;
      await audio.play();
    } catch (error) {
      console.error("Error playing victory music:", error);
    }
  }, [audioContext]);

  // Função para tocar a sequência de vitória
  const playVictorySequence = useCallback(async () => {
    if (!audioContext) return;
    setIsPlaying(true);

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const freq of notes) {
      await playNote(freq);
      await delay(200);
    }

    setIsPlaying(false);
    setIsUnlocking(true);

    // Primeiro timer: Mostra a mensagem de sucesso após 2 segundos
    const successTimer = setTimeout(() => {
      setIsUnlocking(false);
      setShowSuccess(true);
      playVictoryMusic();
    }, 2000);

    // Segundo timer: Fecha o alert e mostra o vídeo após 12 segundos (2s + 10s)
    const videoTimer = setTimeout(() => {
      setIsCorrect(false);
      setShowSuccess(false);
      setIsUnlocking(false);
      setShowVideo(true);

      if (videoRef.current) {
        videoRef.current.style.position = "fixed";
        videoRef.current.style.top = "0";
        videoRef.current.style.left = "0";
        videoRef.current.style.width = "100%";
        videoRef.current.style.height = "100%";
        videoRef.current.style.zIndex = "9999";
        videoRef.current.style.objectFit = "contain";
        videoRef.current.style.backgroundColor = "black";
        videoRef.current.play().catch((error) => {
          console.error("Error playing video:", error);
        });
      }
    }, 12000);

    // Cleanup function para ambos os timers
    return () => {
      clearTimeout(successTimer);
      clearTimeout(videoTimer);
    };
  }, [audioContext, playNote, playVictoryMusic]);

  const handleNoteClick = async (note) => {
    if (isPlaying) return;

    const noteObj = notes.find((n) => n.key === note);
    await playNote(noteObj.freq);

    setSequence((prev) => {
      const newSequence = [...prev, note];

      if (newSequence.length === correctSequence.length) {
        if (newSequence.every((n, i) => n === correctSequence[i])) {
          setIsCorrect(true);
          playVictorySequence();
        } else {
          setTimeout(() => {
            setSequence([]);
            setAttempts((prev) => prev + 1);

            if (attempts > 0 && attempts % 2 === 0) {
              setRevealedClues((prev) =>
                Math.min(prev + 1, visualClues.length)
              );
            }
          }, 1000);
        }
      }

      return newSequence;
    });
  };

  return (
    <div
      className={`p-8 max-w-4xl mx-auto bg-gray-900 rounded-lg relative overflow-hidden transition-all duration-500 ${
        isCorrect ? "ring-4 ring-blue-500" : ""
      }`}
    >
      <div className="relative z-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl text-blue-400 mb-4 font-alien">
            Relicário Nephallen
          </h2>
          <p className="text-gray-300 mb-4">
            Reproduza a sequência ancestral para adentrar ao Relicário Nephallen
          </p>

          <div className="mb-6 space-y-4">
            {visualClues.slice(0, revealedClues).map((clue, index) => (
              <div
                key={index}
                className="flex flex-col items-center space-y-2 animate-fade-in"
              >
                <div className="text-2xl text-blue-400 font-alien tracking-wider">
                  {clue.symbol}
                </div>
                <div className="text-sm text-gray-400 italic">{clue.text}</div>
              </div>
            ))}
          </div>

          <div className="text-xl text-blue-500 font-mono space-x-2 mb-4">
            {sequence.map((note, i) => (
              <span
                key={i}
                className="inline-block px-3 py-1 bg-blue-900 rounded animate-pulse"
              >
                {notes.find((n) => n.key === note).symbol} {note}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-3 mb-8">
          {notes.map(({ key, color, symbol }) => (
            <button
              key={key}
              onClick={() => handleNoteClick(key)}
              disabled={isPlaying}
              className={`
                ${color} 
                relative 
                hover:opacity-80 
                text-white 
                font-bold 
                py-16 
                rounded-lg 
                transition-all 
                duration-200 
                transform 
                hover:scale-105 
                active:scale-95
                ${isPlaying ? "opacity-50" : ""}
              `}
            >
              <div className="flex flex-col items-center space-y-2">
                <span className="text-3xl">{symbol}</span>
                <span className="text-xl">{key}</span>
              </div>
              <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 rounded-lg" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-2 bg-blue-500 rounded-full opacity-30 animate-pulse"
              style={{
                animationDelay: `${i * 200}ms`,
                opacity: attempts > i ? "0.6" : "0.3",
              }}
            />
          ))}
        </div>
      </div>

      <AlertDialog open={isCorrect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Sequência Correta - Acesso Concedido
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isUnlocking ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin" />
                  <span>Desbloqueando mecanismo...</span>
                </div>
              ) : showSuccess ? (
                <div className="text-center">
                  <p className="text-2xl font-semibold text-green-500">
                    Bem-vindo ao Relicário Nephallen!
                  </p>
                </div>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video element outside of alert dialog */}
      <video
        ref={videoRef}
        className={showVideo ? "" : "hidden"}
        playsInline
        loop
        src={videoFile}
        onLoadedData={() => {
          setVideoLoaded(true);
          setIsUnlocking(false);
        }}
        onError={(e) => {
          console.error("Video error:", e);
          setIsUnlocking(false);
        }}
      />
    </div>
  );
};

export default MusicPuzzle;
