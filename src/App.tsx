import { useEffect, useReducer, useRef } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { TournamentScreen } from './components/TournamentScreen';
import { clearTournament, loadTournament, saveTournament } from './lib/storage.ts';
import { tournamentReducer } from './lib/tournamentReducer.ts';

export default function App() {
  const [tournament, dispatch] = useReducer(tournamentReducer, null, loadTournament);
  const hadTournament = useRef(tournament !== null);

  useEffect(() => {
    if (tournament) saveTournament(tournament);
    // Só limpa quando um torneio é encerrado; na montagem sem torneio não há o
    // que limpar, e um salvo por versão mais nova do app deve ser preservado.
    else if (hadTournament.current) clearTournament();
    hadTournament.current = tournament !== null;
  }, [tournament]);

  return (
    <div className="app-shell">
      {tournament ? (
        <TournamentScreen state={tournament} dispatch={dispatch} />
      ) : (
        <HomeScreen
          onStart={(config, participants) => dispatch({ type: 'start', config, participants })}
          onImport={(state) => dispatch({ type: 'import', state })}
        />
      )}
    </div>
  );
}
