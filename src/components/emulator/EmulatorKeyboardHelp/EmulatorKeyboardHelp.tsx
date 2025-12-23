/**
 * EmulatorKeyboardHelp Component
 * Modal showing keyboard mappings for each console
 */

import { memo, useMemo } from 'react';
import clsx from 'clsx';
import type { ConsoleType } from '@/types/console.types';
import { CONSOLE_CONFIG } from '@/types/console.types';
import { Modal } from '@/components/common/Modal';
import { Icon, type IconName } from '@/components/common/Icon';
import styles from './EmulatorKeyboardHelp.module.css';

export interface EmulatorKeyboardHelpProps {
  /** Console type to show controls for */
  console: ConsoleType;
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
}

/**
 * Key mapping definition
 */
interface KeyMapping {
  action: string;
  keys: string[];
}

/**
 * Section of key mappings
 */
interface MappingSection {
  title: string;
  icon: IconName;
  mappings: KeyMapping[];
}

/**
 * Default key mappings for all consoles
 */
const BASE_MAPPINGS: MappingSection[] = [
  {
    title: 'Movement',
    icon: 'gamepad',
    mappings: [
      { action: 'Up', keys: ['Arrow Up', 'W'] },
      { action: 'Down', keys: ['Arrow Down', 'S'] },
      { action: 'Left', keys: ['Arrow Left', 'A'] },
      { action: 'Right', keys: ['Arrow Right', 'D'] },
    ],
  },
  {
    title: 'System',
    icon: 'settings',
    mappings: [
      { action: 'Start', keys: ['Enter'] },
      { action: 'Select', keys: ['Shift'] },
      { action: 'Quick Save (F5)', keys: ['F5'] },
      { action: 'Quick Load (F8)', keys: ['F8'] },
      { action: 'Pause', keys: ['P', 'Escape'] },
      { action: 'Fullscreen', keys: ['F'] },
      { action: 'Mute', keys: ['M'] },
    ],
  },
];

/**
 * Console-specific action button mappings
 */
const CONSOLE_ACTION_MAPPINGS: Record<ConsoleType, KeyMapping[]> = {
  nes: [
    { action: 'A Button', keys: ['X'] },
    { action: 'B Button', keys: ['Z'] },
  ],
  snes: [
    { action: 'A Button', keys: ['X'] },
    { action: 'B Button', keys: ['Z'] },
    { action: 'X Button', keys: ['S'] },
    { action: 'Y Button', keys: ['A'] },
    { action: 'L Shoulder', keys: ['Q'] },
    { action: 'R Shoulder', keys: ['E'] },
  ],
  ps1: [
    { action: 'Cross (X)', keys: ['X'] },
    { action: 'Circle (O)', keys: ['C'] },
    { action: 'Square', keys: ['Z'] },
    { action: 'Triangle', keys: ['S'] },
    { action: 'L1', keys: ['Q'] },
    { action: 'R1', keys: ['E'] },
    { action: 'L2', keys: ['1'] },
    { action: 'R2', keys: ['3'] },
  ],
  n64: [
    { action: 'A Button', keys: ['X'] },
    { action: 'B Button', keys: ['Z'] },
    { action: 'C-Up', keys: ['I'] },
    { action: 'C-Down', keys: ['K'] },
    { action: 'C-Left', keys: ['J'] },
    { action: 'C-Right', keys: ['L'] },
    { action: 'L Shoulder', keys: ['Q'] },
    { action: 'R Shoulder', keys: ['E'] },
    { action: 'Z Trigger', keys: ['Space'] },
  ],
  gb: [
    { action: 'A Button', keys: ['X'] },
    { action: 'B Button', keys: ['Z'] },
  ],
  gba: [
    { action: 'A Button', keys: ['X'] },
    { action: 'B Button', keys: ['Z'] },
    { action: 'L Shoulder', keys: ['Q'] },
    { action: 'R Shoulder', keys: ['E'] },
  ],
};

/**
 * KeyDisplay component for rendering keyboard keys
 */
function KeyDisplay({ keys }: { keys: string[] }) {
  return (
    <div className={styles.keys}>
      {keys.map((key, index) => (
        <span key={key}>
          {index > 0 && <span className={styles.keySeparator}>or</span>}
          <span className={styles.key}>{key}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * MappingSection component for rendering a group of mappings
 */
function MappingSectionDisplay({ section }: { section: MappingSection }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <Icon name={section.icon} size={18} className={styles.sectionIcon} />
        <h3 className={styles.sectionTitle}>{section.title}</h3>
      </div>
      <div className={styles.sectionContent}>
        <div className={styles.mappingList}>
          {section.mappings.map((mapping) => (
            <div key={mapping.action} className={styles.mapping}>
              <span className={styles.action}>{mapping.action}</span>
              <KeyDisplay keys={mapping.keys} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * EmulatorKeyboardHelp displays keyboard controls for the selected console
 */
export const EmulatorKeyboardHelp = memo(function EmulatorKeyboardHelp({
  console: consoleType,
  isOpen,
  onClose,
}: EmulatorKeyboardHelpProps) {
  // Get console configuration
  const consoleConfig = CONSOLE_CONFIG[consoleType];

  // Build sections with console-specific actions
  const sections = useMemo<MappingSection[]>(() => {
    const actionMappings = CONSOLE_ACTION_MAPPINGS[consoleType] || [];

    return [
      BASE_MAPPINGS[0], // Movement
      {
        title: 'Actions',
        icon: 'play' as IconName,
        mappings: actionMappings,
      },
      BASE_MAPPINGS[1], // System
    ];
  }, [consoleType]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Controls"
      size="md"
    >
      <div className={styles.content}>
        {/* Console badge */}
        <div className={styles.consoleBadge}>
          <Icon name="gamepad" size={16} aria-hidden />
          <span>{consoleConfig.name}</span>
        </div>

        {/* Visual keyboard layout */}
        <div className={styles.keyboardLayout} aria-hidden="true">
          <div className={styles.keyboardRow}>
            {['1', '2', '3', 'Q', 'W', 'E'].map((key) => (
              <div
                key={key}
                className={clsx(styles.keyboardKey, {
                  [styles.active]: ['Q', 'W', 'E'].includes(key),
                })}
              >
                {key}
              </div>
            ))}
          </div>
          <div className={styles.keyboardRow}>
            {['A', 'S', 'D', 'Z', 'X', 'C'].map((key) => (
              <div
                key={key}
                className={clsx(styles.keyboardKey, {
                  [styles.active]: ['A', 'S', 'D', 'Z', 'X', 'C'].includes(key),
                })}
              >
                {key}
              </div>
            ))}
          </div>
          <div className={styles.keyboardRow}>
            <div className={clsx(styles.keyboardKey, styles.space)}>Space</div>
          </div>
          <div className={styles.keyboardRow}>
            <div className={clsx(styles.keyboardKey, styles.arrow, styles.active)}>
              Up
            </div>
          </div>
          <div className={styles.keyboardRow}>
            <div className={clsx(styles.keyboardKey, styles.arrow, styles.active)}>
              Left
            </div>
            <div className={clsx(styles.keyboardKey, styles.arrow, styles.active)}>
              Down
            </div>
            <div className={clsx(styles.keyboardKey, styles.arrow, styles.active)}>
              Right
            </div>
          </div>
        </div>

        {/* Mapping sections */}
        {sections.map((section) => (
          <MappingSectionDisplay key={section.title} section={section} />
        ))}

        {/* Footer note */}
        <div className={styles.footer}>
          <Icon name="settings" size={14} className={styles.footerIcon} aria-hidden />
          <span>You can customize controls in Settings</span>
        </div>
      </div>
    </Modal>
  );
});
