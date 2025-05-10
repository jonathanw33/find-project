import React, { useEffect, useState } from 'react';
import { Truck, Flag, Navigation, MapPin } from 'lucide-react';

interface SimpleMapProps {
  center?: { lat: number; lng: number };
  vehiclePosition?: { latitude: number; longitude: number };
  destinationPosition?: { latitude: number; longitude: number };
  trackerPosition?: { latitude: number; longitude: number };
  zoom?: number;
  isLoading?: boolean;
  status?: string;
}

/**
 * SimpleMap component that displays a map visualization for recovery requests
 * This uses a static visualization approach that doesn't rely on dynamic imports
 */
const SimpleMap: React.FC<SimpleMapProps> = ({
  center = { lat: -6.890233, lng: 107.610332 }, // Default: Bandung
  vehiclePosition,
  destinationPosition,
  trackerPosition,
  zoom = 15,
  isLoading = false,
  status = 'pending'
}) => {
  // Generate a grid pattern for the map background
  const gridSize = 20;
  const [mapGrid, setMapGrid] = useState<JSX.Element[]>([]);
  const [animationStep, setAnimationStep] = useState(0);

  // Calculate relative positions on the map based on coordinates
  const calculatePosition = (lat: number | undefined, lng: number | undefined): { x: number; y: number } => {
    // Use default values if coordinates are undefined
    const validLat = typeof lat === 'number' ? lat : center.lat;
    const validLng = typeof lng === 'number' ? lng : center.lng;
    
    // Simple linear mapping based on the difference from the center
    const latDiff = validLat - center.lat;
    const lngDiff = validLng - center.lng;
    
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

  // Animation effect for vehicle movement
  useEffect(() => {
    if (!isLoading && status !== 'completed') {
      const interval = setInterval(() => {
        setAnimationStep((prev) => (prev + 1) % 100);
      }, 500);
      
      return () => clearInterval(interval);
    }
  }, [isLoading, status]);

  // Get position for the vehicle marker
  const vehiclePos = vehiclePosition
    ? calculatePosition(vehiclePosition.latitude, vehiclePosition.longitude)
    : calculatePosition(center.lat, center.lng);

  // Get position for the destination marker
  const destinationPos = destinationPosition
    ? calculatePosition(destinationPosition.latitude, destinationPosition.longitude)
    : calculatePosition(center.lat + 0.01, center.lng + 0.01);

  // Get position for the tracker marker
  const trackerPos = trackerPosition
    ? calculatePosition(trackerPosition.latitude, trackerPosition.longitude)
    : calculatePosition(center.lat, center.lng);

  // Calculate the path between points
  const getPathPoints = (): string => {
    if (!vehiclePos || !destinationPos) return '';
    
    // Draw a line from vehicle to destination
    return `M ${vehiclePos.x}% ${vehiclePos.y}% L ${destinationPos.x}% ${destinationPos.y}%`;
  };

  // Calculate the animated position along the path
  const getAnimatedPosition = () => {
    if (!vehiclePos || !destinationPos || status === 'completed') return vehiclePos;
    
    // Linear interpolation between start and end points based on animationStep
    const x = vehiclePos.x + (destinationPos.x - vehiclePos.x) * (animationStep / 100);
    const y = vehiclePos.y + (destinationPos.y - vehiclePos.y) * (animationStep / 100);
    
    return { x, y };
  };

  // Get the animated position for the vehicle
  const animatedVehiclePos = getAnimatedPosition();

  // Determine map status color
  const getStatusColor = () => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative w-full h-full bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-blue-50 overflow-hidden rounded-lg border border-gray-200">
      {/* Map status indicator */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-md">
        <span className={`h-3 w-3 rounded-full ${getStatusColor()}`}></span>
        <span className="text-xs font-medium capitalize">{status.replace('_', ' ')}</span>
      </div>
      
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
      
      {/* Vehicle marker - Animated */}
      {animatedVehiclePos && (
        <div
          className="absolute flex flex-col items-center transition-all duration-500 ease-in-out"
          style={{
            left: `${animatedVehiclePos.x}%`,
            top: `${animatedVehiclePos.y}%`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className={`p-2 rounded-full ${getStatusColor()} text-white ${status !== 'completed' ? 'animate-pulse' : ''}`}>
            <Truck className="h-5 w-5" />
          </div>
          <div className="mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium">
            Recovery Vehicle
          </div>
        </div>
      )}
      
      {/* Map attribution */}
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
        FIND Recovery Visualization
      </div>
    </div>
  );
};

export default SimpleMap;