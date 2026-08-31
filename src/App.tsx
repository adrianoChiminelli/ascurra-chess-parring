import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { TournamentScreen } from './components/TournamentScreen';
import { generateNextRound } from './lib/tournament.ts';
import type { Participant, TournamentConfig, TournamentState } from './types';

export default function App() {
  const [tournament, setTournament] = useState<TournamentState | null>(null);

  function handleStart(config: TournamentConfig, participants: Participant[]) {
    const firstRound = generateNextRound(participants, []);
    setTournament({ config, participants, rounds: [firstRound] });
  }

  return (
    <div className="app-shell">
      {tournament ? (
        <TournamentScreen
          state={tournament}
          onChange={setTournament}
          onNewTournament={() => setTournament(null)}
        />
      ) : (
        <HomeScreen onStart={handleStart} />
      )}
    </div>
  );
}
