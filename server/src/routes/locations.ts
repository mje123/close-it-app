import { Router, Request, Response } from 'express';

const router = Router();

const STATES: Record<string, { name: string; counties: string[] }> = {
  DC: {
    name: 'District of Columbia',
    counties: ['Washington DC']
  },
  MD: {
    name: 'Maryland',
    counties: ['Montgomery', 'Prince Georges', 'Howard', 'Anne Arundel', 'Baltimore City', 'Baltimore County', 'Frederick', 'Harford', 'Carroll', 'Charles']
  },
  VA: {
    name: 'Virginia',
    counties: ['Arlington', 'Alexandria City', 'Fairfax', 'Falls Church City', 'Loudoun', 'Prince William', 'Fauquier', 'Stafford', 'Spotsylvania', 'Fredericksburg City']
  },
  FL: {
    name: 'Florida',
    counties: ['Miami-Dade', 'Broward', 'Palm Beach', 'Hillsborough', 'Orange', 'Pinellas', 'Duval', 'Lee', 'Polk', 'Brevard', 'Calhoun']
  },
  CA: {
    name: 'California',
    counties: ['Los Angeles', 'San Diego', 'Orange', 'Santa Clara', 'Alameda', 'Sacramento', 'Contra Costa', 'San Francisco', 'Riverside', 'San Bernardino']
  },
  NY: {
    name: 'New York',
    counties: ['New York (Manhattan)', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Nassau', 'Suffolk', 'Westchester', 'Erie', 'Monroe']
  },
  TX: {
    name: 'Texas',
    counties: ['Harris', 'Dallas', 'Tarrant', 'Travis', 'Bexar', 'Collin', 'Denton', 'El Paso', 'Hidalgo', 'Fort Bend']
  },
  IL: {
    name: 'Illinois',
    counties: ['Cook', 'DuPage', 'Lake', 'Will', 'Kane', 'McHenry', 'Winnebago', 'Sangamon', 'Peoria', 'McLean']
  },
  PA: {
    name: 'Pennsylvania',
    counties: ['Philadelphia', 'Allegheny', 'Montgomery', 'Bucks', 'Delaware', 'Chester', 'Lancaster', 'York', 'Berks', 'Luzerne']
  },
  GA: {
    name: 'Georgia',
    counties: ['Fulton', 'Gwinnett', 'Cobb', 'DeKalb', 'Cherokee', 'Forsyth', 'Clayton', 'Henry', 'Hall', 'Richmond']
  },
  NC: {
    name: 'North Carolina',
    counties: ['Mecklenburg', 'Wake', 'Guilford', 'Forsyth', 'Durham', 'Cumberland', 'Union', 'Alamance', 'Cabarrus', 'Gaston']
  },
  WA: {
    name: 'Washington',
    counties: ['King', 'Pierce', 'Snohomish', 'Spokane', 'Clark', 'Thurston', 'Kitsap', 'Whatcom', 'Benton', 'Skagit']
  }
};

router.get('/states', (_req: Request, res: Response): void => {
  const states = Object.entries(STATES).map(([code, data]) => ({ code, name: data.name }));
  res.json({ states });
});

router.get('/counties/:stateCode', (req: Request, res: Response): void => {
  const state = STATES[req.params.stateCode.toUpperCase()];
  if (!state) {
    res.status(404).json({ error: 'State not found' });
    return;
  }
  res.json({ counties: state.counties });
});

export default router;
