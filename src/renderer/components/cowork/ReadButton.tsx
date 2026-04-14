import React from 'react';

import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { i18nService } from '@/services/i18n';

interface ReadButtonProps {
  /** The text (may contain Markdown) to be read aloud. */
  content: string;
  /** Controls button opacity, mirrors the `visible` prop pattern of CopyButton. */
  visible: boolean;
}

const ReadButton: React.FC<ReadButtonProps> = ({ content, visible }) => {
  const { status, speak, pause, resume, stop, isSupported } = useSpeechSynthesis();

  if (!isSupported) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (status === 'idle') {
      speak(content);
    } else if (status === 'playing') {
      pause();
    } else if (status === 'paused') {
      resume();
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    stop();
  };

  const isActive = status !== 'idle';
  const title =
    status === 'playing'
      ? i18nService.t('readAloudPause')
      : status === 'paused'
        ? i18nService.t('readAloudResume')
        : i18nService.t('readAloud');

  return (
    <div className="inline-flex items-center gap-0.5">
      {/* Play / Pause / Resume button */}
      <button
        onClick={handleClick}
        className={`p-1.5 rounded-md hover:bg-surface-raised transition-all duration-200 ${
          visible || isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${isActive ? 'text-primary' : 'text-[var(--icon-secondary)]'}`}
        title={title}
      >
        {status === 'playing' ? (
          /* Pause icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : status === 'paused' ? (
          /* Resume (play) icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        ) : (
          /* Speaker / read-aloud icon */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* Stop button — only visible while active */}
      {isActive && (
        <button
          onClick={handleStop}
          className="p-1.5 rounded-md hover:bg-surface-raised transition-all duration-200 text-[var(--icon-secondary)] hover:text-foreground"
          title={i18nService.t('readAloudStop')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4"
          >
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ReadButton;
