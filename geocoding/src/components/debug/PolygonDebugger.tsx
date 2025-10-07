import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGenericCrud } from '@/hooks/useGenericCrud';
import { useAuthStore } from '@/stores/authStore';
import type LandRegistry from '@/types/landRegistry.type';

interface PolygonDebuggerProps {
  drawRef: React.RefObject<any>;
  terraDrawInitialized: boolean;
}

const PolygonDebugger: React.FC<PolygonDebuggerProps> = ({ drawRef, terraDrawInitialized }) => {
  const { isAuthenticated } = useAuthStore();
  const { data: lands, loading: landsLoading } = useGenericCrud<LandRegistry>('lands');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const analyzeLandData = () => {
    if (!lands || !Array.isArray(lands)) {
      setDebugInfo({ error: 'No lands data available' });
      return;
    }

    const analysis = {
      totalLands: lands.length,
      landsWithCoordinations: lands.filter(land => land.coordinations && land.coordinations.trim() !== '').length,
      landsWithoutCoordinations: lands.filter(land => !land.coordinations || land.coordinations.trim() === '').length,
      coordinationsAnalysis: [] as any[],
      terraDrawStatus: {
        initialized: terraDrawInitialized,
        hasDrawRef: !!drawRef.current,
        currentMode: drawRef.current?.getMode?.() || 'unknown',
        featureCount: drawRef.current?.getSnapshot?.()?.length || 0
      }
    };

    // Analyze each land's coordinations
    lands.forEach((land) => {
      const landAnalysis = {
        id: land.id,
        name: land.land_name,
        code: land.land_code,
        hasCoordinations: !!land.coordinations,
        coordinationsLength: land.coordinations?.length || 0,
        coordinationsPreview: land.coordinations?.substring(0, 100) + '...' || 'N/A',
        isValidJSON: false,
        geojsonType: null,
        geometryType: null,
        hasCoordinates: false,
        coordinatesLength: 0,
        featureCount: 0,
        error: null as string | null
      };

      if (land.coordinations) {
        try {
          const parsed = JSON.parse(land.coordinations);
          landAnalysis.isValidJSON = true;
          landAnalysis.geojsonType = parsed.type;
          
          // Additional validation
          if (parsed.type === 'Feature') {
            landAnalysis.geometryType = parsed.geometry?.type;
            landAnalysis.hasCoordinates = !!parsed.geometry?.coordinates;
            landAnalysis.coordinatesLength = parsed.geometry?.coordinates?.length || 0;
          } else if (parsed.type === 'FeatureCollection') {
            landAnalysis.featureCount = parsed.features?.length || 0;
          } else if (parsed.type === 'Polygon') {
            landAnalysis.hasCoordinates = !!parsed.coordinates;
            landAnalysis.coordinatesLength = parsed.coordinates?.length || 0;
          }
        } catch (e) {
          landAnalysis.error = e instanceof Error ? e.message : 'Unknown error';
        }
      }

      analysis.coordinationsAnalysis.push(landAnalysis);
    });

    setDebugInfo(analysis);
  };

  const testPolygonLoading = async () => {
    if (!drawRef.current || !lands) {
      setTestResults([{ error: 'TerraDraw not ready or no lands data' }]);
      return;
    }

    const results = [];
    
    for (const land of lands.slice(0, 3)) { // Test first 3 lands
      if (!land.coordinations) {
        results.push({
          landId: land.id,
          landName: land.land_name,
          status: 'skipped',
          reason: 'No coordinations data'
        });
        continue;
      }

      try {
        const geojson = JSON.parse(land.coordinations);
        const testFeature = {
          type: "Feature" as const,
          geometry: geojson.type === 'Feature' ? geojson.geometry : geojson,
          properties: {
            mode: 'polygon',
            landId: land.id,
            landName: land.land_name,
            landCode: land.land_code,
            test: true
          }
        };

        // Try to add the feature
        drawRef.current.addFeatures([testFeature]);
        
        results.push({
          landId: land.id,
          landName: land.land_name,
          status: 'success',
          geojsonType: geojson.type,
          geometryType: testFeature.geometry.type
        });
      } catch (e) {
        results.push({
          landId: land.id,
          landName: land.land_name,
          status: 'error',
          error: e instanceof Error ? e.message : 'Unknown error'
        });
      }
    }

    setTestResults(results);
  };

  const clearTestFeatures = () => {
    if (drawRef.current) {
      const snapshot = drawRef.current.getSnapshot();
      const testFeatures = snapshot.filter((feature: any) => feature.properties?.test);
      if (testFeatures.length > 0) {
        drawRef.current.removeFeatures(testFeatures.map((f: any) => f.id));
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated && !landsLoading && lands) {
      analyzeLandData();
    }
  }, [isAuthenticated, landsLoading, lands, terraDrawInitialized]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Polygon Rendering Debugger
          <Badge variant="outline">
            {terraDrawInitialized ? 'TerraDraw Ready' : 'TerraDraw Not Ready'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{lands?.length || 0}</div>
            <div className="text-sm text-blue-800">Total Lands</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {debugInfo?.landsWithCoordinations || 0}
            </div>
            <div className="text-sm text-green-800">With Coordinations</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {debugInfo?.landsWithoutCoordinations || 0}
            </div>
            <div className="text-sm text-red-800">Without Coordinations</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {debugInfo?.terraDrawStatus?.featureCount || 0}
            </div>
            <div className="text-sm text-purple-800">TerraDraw Features</div>
          </div>
        </div>

        {/* TerraDraw Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">TerraDraw Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Initialized:</span>
              <Badge variant={terraDrawInitialized ? "default" : "destructive"} className="ml-2">
                {terraDrawInitialized ? 'Yes' : 'No'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Draw Reference:</span>
              <Badge variant={!!drawRef.current ? "default" : "destructive"} className="ml-2">
                {!!drawRef.current ? 'Available' : 'Missing'}
              </Badge>
            </div>
            <div>
              <span className="font-medium">Current Mode:</span>
              <span className="ml-2 font-mono">{debugInfo?.terraDrawStatus?.currentMode || 'unknown'}</span>
            </div>
            <div>
              <span className="font-medium">Feature Count:</span>
              <span className="ml-2 font-mono">{debugInfo?.terraDrawStatus?.featureCount || 0}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={analyzeLandData} variant="outline">
            🔄 Refresh Analysis
          </Button>
          <Button onClick={testPolygonLoading} variant="outline">
            🧪 Test Polygon Loading
          </Button>
          <Button onClick={clearTestFeatures} variant="outline">
            🗑️ Clear Test Features
          </Button>
        </div>

        {/* Land Data Analysis */}
        {debugInfo?.coordinationsAnalysis && (
          <div className="space-y-2">
            <h3 className="font-semibold">Land Data Analysis</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {debugInfo.coordinationsAnalysis.map((land: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{land.name}</span>
                      <span className="text-gray-500 ml-2">({land.code})</span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={land.hasCoordinations ? "default" : "destructive"}>
                        {land.hasCoordinations ? 'Has Data' : 'No Data'}
                      </Badge>
                      <Badge variant={land.isValidJSON ? "default" : "destructive"}>
                        {land.isValidJSON ? 'Valid JSON' : 'Invalid JSON'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-gray-600">
                    <div>Type: {land.geojsonType || 'N/A'}</div>
                    <div>Length: {land.coordinationsLength} chars</div>
                    {land.error && <div className="text-red-600">Error: {land.error}</div>}
                    <div className="font-mono text-xs mt-1 bg-gray-100 p-1 rounded">
                      {land.coordinationsPreview}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="p-3 border rounded-lg text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{result.landName}</span>
                    <Badge variant={result.status === 'success' ? "default" : "destructive"}>
                      {result.status}
                    </Badge>
                  </div>
                  {result.error && <div className="text-red-600 mt-1">Error: {result.error}</div>}
                  {result.geojsonType && <div className="text-gray-600">Type: {result.geojsonType}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Raw Debug Info */}
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">Raw Debug Info</summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-60">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
};

export default PolygonDebugger;

