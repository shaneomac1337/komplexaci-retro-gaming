/**
 * GameDetailModal Component
 * Displays detailed game information in a modal dialog
 */

import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Badge, Icon, Button, type IconName } from '../../common';
import { FavoriteButton } from '../FavoriteButton';
import { CONSOLE_CONFIG } from '@/services/emulator/coreConfig';
import type { Game, ConsoleType } from '@/types';
import styles from './GameDetailModal.module.css';

export interface GameDetailModalProps {
  /** Game to display details for */
  game: Game | null;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
}

/**
 * Placeholder image for games without covers
 */
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" fill="%231e293b"%3E%3Crect width="300" height="400"/%3E%3Ctext x="150" y="200" text-anchor="middle" fill="%2364748b" font-size="48"%3E?%3C/text%3E%3C/svg%3E';

/**
 * Format genre for display
 */
function formatGenre(genre: string): string {
  return genre.charAt(0).toUpperCase() + genre.slice(1);
}

/**
 * Metadata item component
 */
interface MetadataItemProps {
  label: string;
  value: string | number | undefined;
  icon: IconName;
}

const MetadataItem = memo(function MetadataItem({
  label,
  value,
  icon,
}: MetadataItemProps) {
  if (!value) return null;

  return (
    <div className={styles.metadataItem}>
      <Icon name={icon} size={16} className={styles.metadataIcon} />
      <div className={styles.metadataContent}>
        <span className={styles.metadataLabel}>{label}</span>
        <span className={styles.metadataValue}>{value}</span>
      </div>
    </div>
  );
});

/**
 * GameDetailModal displays comprehensive game information
 */
export const GameDetailModal = memo(function GameDetailModal({
  game,
  isOpen,
  onClose,
}: GameDetailModalProps) {
  const navigate = useNavigate();

  const handlePlay = useCallback(() => {
    if (game) {
      onClose();
      navigate(`/play/${game.id}`);
    }
  }, [game, navigate, onClose]);

  if (!game) return null;

  const consoleConfig = CONSOLE_CONFIG[game.console as ConsoleType];
  const consoleName = consoleConfig?.name ?? game.console.toUpperCase();
  const coverUrl = game.coverPath || PLACEHOLDER_IMAGE;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      className={styles.modal}
    >
      <div className={styles.container}>
        {/* Cover Art Section */}
        <div className={styles.coverSection}>
          <div className={styles.coverWrapper}>
            <img
              src={coverUrl}
              alt={`${game.title} cover`}
              className={styles.cover}
              crossOrigin="anonymous"
            />
            <div className={styles.coverGlow} />
          </div>
        </div>

        {/* Info Section */}
        <div className={styles.infoSection}>
          {/* Header */}
          <div className={styles.header}>
            <Badge
              variant="console"
              console={game.console as ConsoleType}
              size="md"
            >
              {consoleName}
            </Badge>
            <FavoriteButton gameId={game.id} size="md" />
          </div>

          {/* Title */}
          <h2 className={styles.title}>{game.title}</h2>

          {/* Description */}
          {game.description && (
            <p className={styles.description}>{game.description}</p>
          )}

          {/* Metadata Grid */}
          <div className={styles.metadataGrid}>
            <MetadataItem
              label="Genre"
              value={game.genre ? formatGenre(game.genre) : undefined}
              icon="tag"
            />
            <MetadataItem
              label="Players"
              value={game.players ? `${game.players} Player${game.players > 1 ? 's' : ''}` : undefined}
              icon="users"
            />
            <MetadataItem
              label="Year"
              value={game.releaseYear}
              icon="calendar"
            />
            <MetadataItem
              label="Region"
              value={game.region}
              icon="globe"
            />
            <MetadataItem
              label="Developer"
              value={game.developer}
              icon="code"
            />
            <MetadataItem
              label="Publisher"
              value={game.publisher}
              icon="building"
            />
          </div>

          {/* Tags */}
          {game.tags && game.tags.length > 0 && (
            <div className={styles.tags}>
              {game.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Play Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlay}
            className={styles.playButton}
          >
            <Icon name="play" size={20} />
            Play Now
          </Button>
        </div>
      </div>
    </Modal>
  );
});
