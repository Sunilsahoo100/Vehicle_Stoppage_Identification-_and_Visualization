import React, { useEffect, useState } from 'react';
import { useMap, useMapsLibrary, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import Papa from 'papaparse';

type Coordinate = {
  lat: number;
  lng: number;
  speed: number;
  timestamp: Date;
};

type Poi = {
  location: google.maps.LatLngLiteral;
  reachTime: Date;
  endTime: Date;
  duration: number;
};

const Direction = () => {
  const map = useMap();
  const maps = useMapsLibrary('routes');
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [stoppages, setStoppages] = useState<Poi[]>([]);
  const stoppageThreshold = 5; // User-defined threshold in minutes

  useEffect(() => {
    // Define the function to fetch and parse the CSV file
    const fetchCSVData = async () => {
      try {
        const response = await fetch('./data.csv'); // Update this path
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to get reader from response body');
        }

        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result.value);
        const parsedData = Papa.parse(csv, { header: true });
        console.log(parsedData);

        const coords = parsedData.data.map((row: any) => ({
          lat: parseFloat(row.latitude),
          lng: parseFloat(row.longitude),
          speed: parseFloat(row.speed),
          timestamp: new Date(parseInt(row.eventGeneratedTime, 10)),
        }));

        setCoordinates(coords);

        // Identify stoppages
        const stoppages: Poi[] = [];
        let startStoppage: Coordinate | null = null;

        for (let i = 0; i < coords.length; i++) {
          const currPoint = coords[i];

          if (currPoint.speed === 0) {
            if (!startStoppage) {
              startStoppage = currPoint;
            }
          } else {
            if (startStoppage) {
              const stoppageDuration =
                (currPoint.timestamp.getTime() - startStoppage.timestamp.getTime()) /
                (1000 * 60); // Convert to minutes

              if (stoppageDuration >= stoppageThreshold) {
                stoppages.push({
                  location: { lat: startStoppage.lat, lng: startStoppage.lng },
                  reachTime: startStoppage.timestamp,
                  endTime: currPoint.timestamp,
                  duration: stoppageDuration,
                });
              }

              startStoppage = null;
            }
          }
        }

        // Handle case where the last point in data is still part of a stoppage
        if (startStoppage) {
          const lastPoint = coords[coords.length - 1];
          const stoppageDuration =
            (lastPoint.timestamp.getTime() - startStoppage.timestamp.getTime()) /
            (1000 * 60); // Convert to minutes

          if (stoppageDuration >= stoppageThreshold) {
            stoppages.push({
              location: { lat: startStoppage.lat, lng: startStoppage.lng },
              reachTime: startStoppage.timestamp,
              endTime: lastPoint.timestamp,
              duration: stoppageDuration,
            });
          }
        }

        setStoppages(stoppages);
      } catch (error) {
        console.error('Error fetching and parsing CSV:', error);
      }
    };

    fetchCSVData();
  }, []);

  useEffect(() => {
    if (!map || !maps || coordinates.length === 0) return;

    const flightPath = new google.maps.Polyline({
      path: coordinates.map((coord) => ({ lat: coord.lat, lng: coord.lng })),
      geodesic: true,
      strokeColor: 'yellow',
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });

    flightPath.setMap(map);

    // Clean up on unmount
    return () => {
      flightPath.setMap(null);
    };
  }, [map, maps, coordinates]);

  return (
    <>
      {stoppages.map((poi, index) => (
        <AdvancedMarker
          key={index}
          position={poi.location}
          onClick={() => {
            const infowindow = new google.maps.InfoWindow({
              content: `
                <div>
                  <p><strong>Reach Time:</strong> ${poi.reachTime.toLocaleString()}</p>
                  <p><strong>End Time:</strong> ${poi.endTime.toLocaleString()}</p>
                  <p><strong>Duration:</strong> ${poi.duration.toFixed(2)} minutes</p>
                </div>
              `,
            });
            infowindow.open(map, new google.maps.marker.AdvancedMarkerElement({ position: poi.location }));
          }}
        >
          <Pin background={'#e03434'} glyphColor={'#6b0303'} borderColor={'#000'} />
        </AdvancedMarker>
      ))}
    </>
  );
};

export default Direction;
