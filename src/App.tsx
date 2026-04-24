import heroImg from './assets/hero.png';
import Dashboard from '@containers/dashboard/Dashboard';

const App = () => {
  return (
    <div>
      <img src={heroImg} className="base" width="170" height="179" alt="" />
      <Dashboard />
    </div>
  );
};

export default App;
