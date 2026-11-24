export const APP_VERSION = '0.3.0-beta'
export const APP_CODENAME = 'Couch & Controller'

export const CHANGELOG = [
  {
    version: '0.3.0-beta',
    codename: 'Couch & Controller',
    items: [
      'Full gamepad support: D-Pad / left stick browse the shelf, LB/RB fast-scroll, right-stick case rotation, Y flips the box, X opens Edit, A launches/confirms, B resets or goes back',
      'Auto-detects DualShock/DualSense vs Xbox controllers and shows matching button badges in a context-aware bottom hint bar',
      'Synthesized Web Audio sound effects — shelf scroll ticks, box flip snaps, modal blips, warm launch chime — with a persisted mute toggle',
      'Neutral PC branding throughout — no console-specific labels',
    ],
  },
  {
    version: '0.2.0-beta',
    codename: "Collector's Edition",
    items: [
      'Interactive Three.js game-case shelf with procedurally generated spines and back covers',
      '180° Flip Box animation to inspect back cover, notes, and launch controls',
      'Case Finish selector: Standard, Steelbook (metallic PBR), and Holographic (iridescent) materials',
      'Completion Status badges: Backlog, Playing, Completed, 100% Platinum',
      'Edit and Delete games, including .exe paths and steam://rungameid/<AppID> targets',
      'What\'s New / Changelog modal',
    ],
  },
  {
    version: '0.1.0-beta',
    codename: 'Initial Release',
    items: [
      'Game library with covers, notes, and hours played',
      'Launch local executables or Steam / Epic / URL targets',
      'Library persisted to games.json',
    ],
  },
]
