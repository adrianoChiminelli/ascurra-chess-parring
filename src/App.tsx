import { useEffect, useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { TournamentScreen } from './components/TournamentScreen';
import { clearTournament, loadTournament, saveTournament } from './lib/storage.ts';
import { generateNextRound } from './lib/tournament.ts';
import { type Participant, type TournamentConfig, type TournamentState } from './types';

export default function App() {
  const [tournament, setTournament] = useState<TournamentState | null>(loadTournament);

  useEffect(() => {
    if (tournament) saveTournament(tournament);
    else clearTournament();
  }, [tournament]);

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
