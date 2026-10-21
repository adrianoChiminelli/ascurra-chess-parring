import { useEffect, useReducer } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { TournamentScreen } from './components/TournamentScreen';
import { clearTournament, loadTournament, saveTournament } from './lib/storage.ts';
import { tournamentReducer } from './lib/tournamentReducer.ts';

export default function App() {
  const [tournament, dispatch] = useReducer(tournamentReducer, null, loadTournament);

  useEffect(() => {
    if (tournament) saveTournament(tournament);
    else clearTournament();
  }, [tournament]);

  return (
    <div className="app-shell">
      {tournament ? (
        <TournamentScreen state={tournament} dispatch={dispatch} />
      ) : (
        <HomeScreen onStart={(config, participants) => dispatch({ type: 'start', config, participants })} />
      )}
    </div>
  );
}
