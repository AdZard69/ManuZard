import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const features = [
    {
      icon: '🔥',
      title: 'Casting Module',
      description: 'Liquid metal solidification analysis',
      path: '/casting'
    },
    {
      icon: '⚡',
      title: 'Welding Module',
      description: 'Thermal joining process simulation',
      path: '/welding'
    },
    {
      icon: '🔨',
      title: 'Forging Module',
      description: 'Compressive force deformation',
      path: '/forging'
    },
    {
      icon: '🎚️',
      title: 'Rolling Module',
      description: 'Thickness reduction operations',
      path: '/rolling'
    },
    {
      icon: '➡️',
      title: 'Extrusion Module',
      description: 'Cross-sectional profile creation',
      path: '/extrusion'
    },
    {
      icon: '📄',
      title: 'Sheet Metal',
      description: 'Forming and bending protocols',
      path: '/sheet-metal'
    },
    {
      icon: '🖨️',
      title: '3D Printing',
      description: 'Additive manufacturing layer control',
      path: '/3d-printing'
    },
    {
      icon: '✨',
      title: 'Laser Cutting',
      description: 'Precision thermal separation',
      path: '/laser-cutting'
    }
  ];

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="hero-title">
          <span className="highlight">ManuZard</span>
        </h1>
        <p className="hero-subtitle">
          Manufacturing Process Visualization System
        </p>
        <div className="hero-description">
          <p>
            System initialized. Select a manufacturing module from the control panel to begin 3D simulation and analysis.
          </p>
        </div>
        <div className="hero-contribution">
          <p>Contribution by AdZard(Aditya Soin) for future learners!!</p>
        </div>
      </div>

      <div className="features-grid">
        {features.map((feature) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="feature-card"
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;
