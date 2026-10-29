import { DIFFICULTY } from '../config/difficulty.js';
// Deterministic development fixture. Deliberately ignores the supplied premise.
export function mockCase(difficulty) {
  const config = DIFFICULTY[difficulty];
  const suspects = [
    {
      id: 's1',
      name: 'Clara Vale',
      role: 'Gallery curator',
      description: 'A meticulous curator who has spent years protecting the collection.',
      alibi: 'Claims she was alone cataloguing prints in the archive at 9:10.',
      motive: 'Secret debts and a rejected request to sell the compass.',
    },
    {
      id: 's2',
      name: 'Felix Reed',
      role: 'Restoration specialist',
      description: 'An impatient craftsman with a fondness for expensive antiques.',
      alibi: 'Recorded repairing a frame in the workshop from 9:00 to 9:20.',
      motive: 'Resents being underpaid.',
    },
    {
      id: 's3',
      name: 'Iris Bell',
      role: 'Evening attendant',
      description: 'An observant newcomer who knows every creaking floorboard.',
      alibi: 'Stamped admission tickets at the front desk throughout the incident.',
      motive: 'Wanted the exhibition cancelled.',
    },
    {
      id: 's4',
      name: 'Oscar Finch',
      role: 'Private collector',
      description: 'A charming guest whose offer to buy the compass was declined.',
      alibi: 'On the courtyard security recording during the theft.',
      motive: 'Wants the compass for his collection.',
    },
    {
      id: 's5',
      name: 'Nora Ash',
      role: 'Local reporter',
      description: 'A reporter investigating the gallery’s financial troubles.',
      alibi: 'A continuous recorded interview places her outside from 9:00 to 9:20.',
      motive: 'A scandal would make a compelling story.',
    },
  ].slice(0, config.suspects);
  const clues = [
    {
      label: 'The access ledger',
      location: 'Security desk',
      text: 'The display was unlocked at 9:10 with the curator’s personal key. The key cabinet log shows Clara checked it out at 8:45 and kept it until 9:30.',
      pointsTo: ['s1'],
      isRedHerring: false,
    },
    {
      label: 'A letter left unfinished',
      location: 'Archive desk',
      text: 'A letter in Clara’s handwriting offers the brass compass to a buyer to settle her overdue debts. It specifies delivery after tonight’s exhibition.',
      pointsTo: ['s1'],
      isRedHerring: false,
    },
    {
      label: 'The corridor recording',
      location: 'Camera station',
      text: 'At 9:09 Clara leaves the archive carrying an empty padded case. At 9:12 she returns from the display corridor with the case closed and visibly weighted.',
      pointsTo: ['s1'],
      isRedHerring: false,
    },
    {
      label: 'A fleck of gold',
      location: 'Workshop threshold',
      text: 'Gold flakes on Felix’s coat resemble the compass finish. The workshop video shows them falling from the gilded frame he was restoring continuously from 9:00 to 9:20.',
      pointsTo: ['s2'],
      isRedHerring: true,
    },
    {
      label: 'The ticket roll',
      location: 'Entrance counter',
      text: 'Consecutive timestamped tickets and the entrance camera show Iris remained at the busy front desk from 9:00 to 9:20, away from the display.',
      pointsTo: [],
      isRedHerring: false,
    },
    {
      label: 'A visitor in the rain',
      location: 'Courtyard camera',
      text: 'The recording places Oscar in the courtyard throughout 9:00 to 9:20. Its only door back into the gallery is visible and remains closed.',
      pointsTo: [],
      isRedHerring: false,
    },
    {
      label: 'The velvet lining',
      location: 'Archive cupboard',
      text: 'Clara’s padded case contains a compass-shaped indentation and a fresh brass rubbing. The gallery’s packing register assigns that case exclusively to her.',
      pointsTo: ['s1'],
      isRedHerring: false,
    },
    {
      label: 'An uninterrupted interview',
      location: 'Press recorder',
      text: 'Nora’s unbroken interview recording contains the outside clock striking 9:10. The interviewee confirms they stood together at the gates until 9:20.',
      pointsTo: [],
      isRedHerring: false,
    },
    {
      label: 'A cancelled sale',
      location: 'Correspondence tray',
      text: 'A signed note records Clara’s rejected proposal to sell the compass. A pencilled calculation on the reverse exactly matches the debt in her unfinished letter.',
      pointsTo: ['s1'],
      isRedHerring: false,
    },
  ]
    .slice(0, config.clues)
    .map((cl, i) => ({ id: `c${i + 1}`, ...cl }));
  return {
    title: 'The Midnight Compass',
    story:
      'Rain taps against the tall windows of the Bellweather Gallery. Tonight, the city has gathered to see its newest acquisition: a brass navigator’s compass, recovered from a ship that vanished a century ago. At 9:15, an attendant notices that the velvet-lined display case is empty. There is no broken glass, no alarm, and no sign of a forced lock.\n\nThe gallery closes its doors. The security desk narrows the disappearance to the ten minutes between 9:05 and 9:15. The people still inside offer accounts of where they were, but a claimed alibi is only the beginning of an investigation. A curator, a restorer, and an attendant all know the building well; any additional guests have their own reasons to admire the compass.\n\nYou arrive before anyone is allowed to leave. The evidence is still where it was left: an access ledger, unfinished correspondence, and recordings waiting to be reviewed. Follow the timeline, separate suspicion from proof, and decide whose account fails to fit the facts.',
    suspects,
    clues,
    hints: [
      'Compare the claimed alibis with the recorded times.',
      'Find the person connected to both the display key and a financial motive.',
      'The archive was not occupied continuously. Match the corridor recording to the access ledger.',
    ].slice(0, config.hints),
    solution: {
      culpritId: 's1',
      keyClueIds: ['c1', 'c2', 'c3'],
      explanation:
        'Clara Vale took the compass to settle her debts. Her role gave her access, but the case rests on evidence rather than her position. The access ledger records that her personal key opened the display at 9:10, while the key remained in her custody. This establishes the means. Her unfinished letter offers the compass to a buyer and ties the intended sale to a specific debt, establishing motive.\n\nThe corridor recording supplies the opportunity and contradicts her claim that she stayed in the archive. It shows her leave at 9:09 with an empty padded case and return at 9:12 with the case closed and weighted. Together, these independent clues connect her to the lock, the planned sale, and the precise window of the theft.\n\nFelix’s gold flakes are an explainable distraction: the workshop recording shows them coming from a frame while he worked. Iris’s tickets and the entrance recording corroborate her location. The other available recordings similarly account for any additional guests. Suspicion alone does not outweigh those corroborated alibis.',
    },
  };
}
