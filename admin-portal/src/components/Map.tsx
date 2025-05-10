import React, { useEffect, useState } from 'react';
import { Truck, Flag, Navigation, MapPin } from 'lucide-react';

interface MapProps {
  center?: { lat: number; lng: number };
  vehiclePosition?: { latitude: number; longitude: number };
  destinationPosition?: { latitude: number; longitude: number };
  trackerPosition?: { latitude: number; longitude: number };
  zoom?: number;
}

/**
 * Map component that displays a simulated map
 * This is a simplified version that doesn't use a real map provider
 * In a production app, you would use Google Maps, Mapbox, or another provider
 */
const Map: React.FC<MapProps> = ({
  center,
  vehiclePosition,
  destinationPosition,
  trackerPosition,
  zoom = 15,
}) => {
  // Generate a grid pattern for the map background
  const gridSize = 20;
  const [mapGrid, setMapGrid] = useState<JSX.Element[]>([]);

  // Calculate relative positions on the map based on coordinates
  const calculatePosition = (lat: number, lng: number): { x: number; y: number } => {
    if (!center) return { x: 50, y: 50 }; // Default to center if no reference point

    // Simple linear mapping based on the difference from the center
    // In a real app, you would use proper map projection math
    const latDiff = lat - center.lat;
    const lngDiff = lng - center.lng;
    
    // Scale factor (adjust as needed for your specific use case)
    const scale = 2000;
    
    // Calculate positions in percentage (0-100%) for CSS positioning
    const x = 50 + lngDiff * scale;
    const y = 50 - latDiff * scale; // Subtract because latitude increases northward
    
    return { x, y };
  };

  // Generate the grid pattern
  useEffect(() => {
    const grid = [];
    // Create horizontal lines
    for (let i = 0; i <= 100; i += gridSize) {
      grid.push(
        <line
          key={`h-${i}`}
          x1="0"
          y1={`${i}%`}
          x2="100%"
          y2={`${i}%`}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }
    // Create vertical lines
    for (let i = 0; i <= 100; i += gridSize) {
      grid.push(
        <line
          key={`v-${i}`}
          x1={`${i}%`}
          y1="0"
          x2={`${i}%`}
          y2="100%"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }
    setMapGrid(grid);
  }, [gridSize]);

  // Get position for the vehicle marker
  const vehiclePos = vehiclePosition
    ? calculatePosition(vehiclePosition.latitude, vehiclePosition.longitude)
    : null;

  // Get position for the destination marker
  const destinationPos = destinationPosition
    ? calculatePosition(destinationPosition.latitude, destinationPosition.longitude)
    : null;

  // Get position for the tracker marker
  const trackerPos = trackerPosition
    ? calculatePosition(trackerPosition.latitude, trackerPosition.longitude)
    : null;

  // Calculate the path between points
  const getPathPoints = (): string => {
    if (!vehiclePos || !destinationPos) return '';
    
    // Draw a line from vehicle to destination
    return `M ${vehiclePos.x}% ${vehiclePos.y}% L ${destinationPos.x}% ${destinationPos.y}%`;
  };

  return (
    <div className="relative w-full h-full bg-blue-50 overflow-hidden">
      {/* Map background with grid */}
      <svg className="absolute inset-0 w-full h-full">
        {mapGrid}
      </svg>
      
      {/* City blocks - for decoration */}
      <div className="absolute inset-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`row-${i}`} className="flex justify-around">
            {Array.from({ length: 5 }).map((_, j) => (
              <div
                key={`block-${i}-${j}`}
                className="m-4 bg-gray-100 rounded-md opacity-50"
                style={{ width: '15%', height: '15%' }}
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Path line */}
      {vehiclePos && destinationPos && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <path
            d={getPathPoints()}
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="5,5"
            fill="none"
          />
        </svg>
      )}
      
      {/* Destination marker */}
      {destinationPos && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${destinationPos.x}%`,
            top: `${destinationPos.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="p-2 rounded-full bg-red-500 text-white">
            <Flag className="h-5 w-5" />
          </div>
          <div className="mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium">
            Destination
          </div>
        </div>
      )}
      
      {/* Tracker marker (origin) */}
      {trackerPos && (
        <div
          className="absolute flex flex-col items-center"
          style={{
            left: `${trackerPos.x}%`,
            top: `${trackerPos.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="p-2 rounded-full bg-primary-500 text-white">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium">
            Origin
          </div>
        </div>
      )}
      
      {/* Vehicle marker */}
      {vehiclePos && (
        <div
          className="absolute flex flex-col items-center transition-all duration-1000"
          style={{
            left: `${vehiclePos.x}%`,
            top: `${vehiclePos.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="p-2 rounded-full bg-green-500 text-white animate-pulse">
            <Truck className="h-5 w-5" />
          </div>
          <div className="mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium">
            Delivery Vehicle
          </div>
        </div>
      )}
      
      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        FIND Admin Visualization
      </div>
    </div>
  );
};

export default Map;