import { useState, useEffect } from 'react'
import './App.css'
import Plot from 'react-plotly.js';

// Since we couldn't install the papaparse package, let's use a simpler approach to load the data
// We'll use fetch to load the CSV files and parse them manually

interface DataRow {
  annee: string;
  nationalite: string;
  nombre_dirigeants: number;
}

interface Dataset {
  auto: DataRow[];
  societe: DataRow[];
  tout: DataRow[];
}

function App() {
  const [dataset, setDataset] = useState<Dataset>({
    auto: [],
    societe: [],
    tout: []
  });
  const [loading, setLoading] = useState(true);
  const [datasetType, setDatasetType] = useState<'auto' | 'societe' | 'tout'>('tout');
  const [activeTab, setActiveTab] = useState<'top' | 'selected'>('top');
  const [topN, setTopN] = useState(5);
  const [selectedNationalites, setSelectedNationalites] = useState<string[]>([]);
  const [availableNationalites, setAvailableNationalites] = useState<string[]>([]);

  // Load the CSV data
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Starting to load data...');
        // Use relative paths that include the "public" folder name
        const [autoData, societeData, toutData] = await Promise.all([
          loadCSV('./data-auto-entreprise-nationalite.csv'),
          loadCSV('./data-societe-nationalite.csv'),
          loadCSV('./data-tout-confondu-nationalite.csv')
        ]);

        console.log('Auto data sample:', autoData.slice(0, 3));
        console.log('Société data sample:', societeData.slice(0, 3));
        console.log('Tout confondu data sample:', toutData.slice(0, 3));

        setDataset({
          auto: autoData,
          societe: societeData,
          tout: toutData
        });

        // Set default selected nationalites
        const uniqueNationalites = Array.from(new Set(toutData.map(row => row.nationalite)));
        setAvailableNationalites(uniqueNationalites);
        setSelectedNationalites(uniqueNationalites.slice(0, 5));
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to load CSV
  const loadCSV = async (url: string): Promise<DataRow[]> => {
    console.log(`Fetching CSV from: ${url}`);
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load CSV: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      console.log(`CSV data received, length: ${text.length} characters`);
      console.log('First 200 characters:', text.substring(0, 200));
      
      // Simple CSV parser
      const lines = text.split('\n');
      console.log(`Found ${lines.length} lines in CSV`);
      
      if (lines.length < 2) {
        console.error('CSV has too few lines:', lines);
        return [];
      }
      
      const headerLine = lines[0].trim();
      console.log('Header line:', headerLine);
      const headers = headerLine.split(',').map(h => h.replace(/"/g, '').toLowerCase().trim());
      console.log('Parsed headers:', headers);
      
      if (!headers.includes('annee') || !headers.includes('nationalite') || !headers.includes('nombre_dirigeants')) {
        console.error('CSV is missing required headers:', headers);
        return [];
      }
      
      const dataRows = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map((line, index) => {
          try {
            const values = line.split(',').map(v => v.replace(/"/g, '').trim());
            
            if (values.length !== headers.length) {
              console.warn(`Line ${index + 2} has ${values.length} values but expected ${headers.length}`);
              return null;
            }
            
            const row: Record<string, string | number> = {};
            
            headers.forEach((header, i) => {
              if (header === 'nombre_dirigeants') {
                const parsedValue = parseInt(values[i], 10);
                row[header] = isNaN(parsedValue) ? 0 : parsedValue;
              } else {
                row[header] = values[i];
              }
            });
            
            return {
              annee: row['annee'] as string || '',
              nationalite: row['nationalite'] as string || '',
              nombre_dirigeants: row['nombre_dirigeants'] as number || 0
            };
          } catch (err) {
            console.error(`Error parsing line ${index + 2}:`, line, err);
            return null;
          }
        })
        .filter((row): row is DataRow => row !== null);
      
      console.log(`Successfully parsed ${dataRows.length} data rows`);
      return dataRows;
    } catch (error) {
      console.error('Error loading CSV:', error);
      return [];
    }
  };

  // Get active dataset based on selection
  const getActiveData = (): DataRow[] => {
    return dataset[datasetType] || [];
  };

  // Get title prefix based on dataset type
  const getTitlePrefix = (): string => {
    switch (datasetType) {
      case 'auto':
        return 'Auto-entrepreneurs';
      case 'societe':
        return 'Sociétés';
      case 'tout':
      default:
        return 'Tout confondu';
    }
  };

  // Get top N nationalites
  const getTopNationalites = (): string[] => {
    const data = getActiveData();
    
    // Calculate average nombre_dirigeants by nationality
    const averagesByNationalite: Record<string, number> = {};
    
    data.forEach(row => {
      if (!averagesByNationalite[row.nationalite]) {
        averagesByNationalite[row.nationalite] = 0;
      }
      averagesByNationalite[row.nationalite] += row.nombre_dirigeants;
    });
    
    // Convert to array, calculate averages, and sort
    const uniqueNationalites = Object.keys(averagesByNationalite);
    const countsPerNationalite: Record<string, number> = {};
    
    uniqueNationalites.forEach(nat => {
      countsPerNationalite[nat] = 0;
    });
    
    data.forEach(row => {
      countsPerNationalite[row.nationalite]++;
    });
    
    uniqueNationalites.forEach(nat => {
      averagesByNationalite[nat] /= countsPerNationalite[nat];
    });
    
    // Sort and get top N
    return uniqueNationalites
      .sort((a, b) => averagesByNationalite[b] - averagesByNationalite[a])
      .slice(0, topN);
  };

  // Prepare data for the selected nationalites chart
  const prepareSelectedChart = () => {
    const data = getActiveData();
    const filteredData = selectedNationalites.length > 0
      ? data.filter(row => selectedNationalites.includes(row.nationalite))
      : data;
    
    // Group by nationality
    const nationalites = Array.from(new Set(filteredData.map(row => row.nationalite)));
    
    return nationalites.map(nationalite => {
      const nationaliteData = filteredData.filter(row => row.nationalite === nationalite);
      nationaliteData.sort((a, b) => parseInt(a.annee) - parseInt(b.annee));
      
      return {
        x: nationaliteData.map(row => row.annee),
        y: nationaliteData.map(row => row.nombre_dirigeants),
        type: 'scatter',
        mode: 'lines+markers',
        name: nationalite,
        line: { width: 2.5 },
        opacity: 0.85,
        hovertemplate: '<b>%{fullData.name}</b><br>Année: %{x}<br>Nombre de dirigeants: %{y:,.0f}<extra></extra>'
      };
    });
  };

  // Prepare data for the top nationalites chart
  const prepareTopChart = () => {
    const data = getActiveData();
    console.log(`Preparing top chart with ${data.length} data points`);
    
    if (data.length === 0) {
      console.warn('No data available for the top chart');
      return [];
    }
    
    const topNationalites = getTopNationalites();
    console.log('Top nationalites:', topNationalites);
    
    const filteredData = data.filter(row => topNationalites.includes(row.nationalite));
    console.log(`Filtered to ${filteredData.length} data points for top nationalites`);
    
    // Group by nationality
    const nationalites = Array.from(new Set(filteredData.map(row => row.nationalite)));
    
    return nationalites.map(nationalite => {
      const nationaliteData = filteredData.filter(row => row.nationalite === nationalite);
      nationaliteData.sort((a, b) => parseInt(a.annee) - parseInt(b.annee));
      
      console.log(`${nationalite}: ${nationaliteData.length} data points, nombre de dirigeants:`, 
                 nationaliteData.map(row => row.nombre_dirigeants));
      
      return {
        x: nationaliteData.map(row => row.annee),
        y: nationaliteData.map(row => row.nombre_dirigeants),
        type: 'scatter',
        mode: 'lines+markers',
        name: nationalite,
        line: { width: 3 },
        marker: { size: 8 },
        opacity: 1,
        hovertemplate: '<b>%{fullData.name}</b><br>Année: %{x}<br>Nombre de dirigeants: %{y:,.0f}<extra></extra>'
      };
    });
  };

  // Common layout configuration
  const getCommonLayout = (title: string) => ({
    title: { 
      text: title,
      font: { color: '#fff' }
    },
    xaxis: {
      title: { text: 'Année', font: { color: '#fff' } },
      showgrid: true,
      gridwidth: 0.5,
      gridcolor: '#444',
      type: 'category', // Ensure x-axis treats years as categories
      tickfont: { color: '#fff' }
    },
    yaxis: {
      title: { text: 'Nombre de dirigeants', font: { color: '#fff' } },
      showgrid: true,
      gridwidth: 0.5,
      gridcolor: '#444',
      rangemode: 'tozero', // Force y-axis to start at zero
      automargin: true,
      tickfont: { color: '#fff' }
    },
    legend: {
      orientation: 'h',
      yanchor: 'bottom',
      y: 1.02,
      xanchor: 'right',
      x: 1,
      font: { color: '#fff' },
      bgcolor: 'rgba(34, 34, 34, 0.5)'
    },
    template: 'plotly_dark',
    height: 600,
    autosize: true,
    margin: { l: 50, r: 50, b: 80, t: 100 },
    paper_bgcolor: '#222',
    plot_bgcolor: '#222'
  });

  // Handle change in dataset type
  const handleDatasetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as 'auto' | 'societe' | 'tout';
    setDatasetType(value);
    
    // Update available nationalites
    const uniqueNationalites = Array.from(new Set(dataset[value].map(row => row.nationalite)));
    setAvailableNationalites(uniqueNationalites);
    setSelectedNationalites(uniqueNationalites.slice(0, 5));
  };

  // Handle change in top N slider
  const handleTopNChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTopN(parseInt(event.target.value));
  };

  // Handle change in selected nationalites
  const handleNationaliteChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const selected: string[] = [];
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    
    setSelectedNationalites(selected);
  };

  if (loading) {
    return <div className="loading">Chargement des données...</div>;
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Évolution du nombre de dirigeants par nationalité (2015-2024)</h1>
      
      <div className="controls">
        <div className="dataset-selector">
          <label>Sélectionner le type de données:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="dataset"
                value="auto"
                checked={datasetType === 'auto'}
                onChange={handleDatasetChange}
              />
              Auto-entrepreneurs
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="dataset"
                value="societe"
                checked={datasetType === 'societe'}
                onChange={handleDatasetChange}
              />
              Sociétés
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="dataset"
                value="tout"
                checked={datasetType === 'tout'}
                onChange={handleDatasetChange}
              />
              Tout confondu
            </label>
          </div>
        </div>
      </div>
      
      <div className="tabs">
        <div className="tab-buttons">
          <button
            className={`tab-button ${activeTab === 'top' ? 'active' : ''}`}
            onClick={() => setActiveTab('top')}
          >
            Top nationalités
          </button>
          <button
            className={`tab-button ${activeTab === 'selected' ? 'active' : ''}`}
            onClick={() => setActiveTab('selected')}
          >
            Nationalités sélectionnées
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'top' && (
            <div className="top-nationalites">
              <div className="slider-container">
                <label htmlFor="top-n-slider">Nombre de nationalités les plus populaires: {topN}</label>
                <input
                  id="top-n-slider"
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={topN}
                  onChange={handleTopNChange}
                />
              </div>
              
              <Plot
                data={prepareTopChart()}
                layout={getCommonLayout(`${getTitlePrefix()} - Top ${topN} des nationalités par nombre d'itérations`)}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          )}
          
          {activeTab === 'selected' && (
            <div className="selected-nationalites">
              <div className="dropdown-container">
                <label htmlFor="nationalites-select">Sélectionner les nationalités:</label>
                <select
                  id="nationalites-select"
                  multiple
                  value={selectedNationalites}
                  onChange={handleNationaliteChange}
                  size={6}
                >
                  {availableNationalites.map(nationalite => (
                    <option key={nationalite} value={nationalite}>
                      {nationalite}
                    </option>
                  ))}
                </select>
                <p className="help-text">
                  Utilisez la touche Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs nationalités
                </p>
              </div>
              
              <Plot
                data={prepareSelectedChart()}
                layout={getCommonLayout(`${getTitlePrefix()} - Évolution des ${selectedNationalites.length} nationalités sélectionnées`)}
                style={{ width: '100%' }}
                useResizeHandler
              />
            </div>
          )}
        </div>
      </div>
      
      <footer className="app-footer">
        <p>Visualisation interactive des nationalités avec React et Plotly.</p>
      </footer>
    </div>
  );
}

export default App
