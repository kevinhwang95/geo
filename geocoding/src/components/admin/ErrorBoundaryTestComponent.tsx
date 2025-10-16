import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bug, AlertTriangle } from 'lucide-react';

interface ErrorBoundaryTestComponentProps {
  shouldThrowError?: boolean;
}

const ErrorBoundaryTestComponent: React.FC<ErrorBoundaryTestComponentProps> = ({ 
  shouldThrowError = false 
}) => {
  const [throwError, setThrowError] = useState(shouldThrowError);

  if (throwError) {
    // This will trigger the ErrorBoundary
    throw new Error('This is a test error from ErrorBoundaryTestComponent');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-red-500" />
          <span>Error Boundary Test Component</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This component is designed to test the React Error Boundary functionality.
            Click the button below to trigger an error that will be caught by the ErrorBoundary.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={() => setThrowError(true)}
          variant="destructive"
          className="w-full"
        >
          <Bug className="h-4 w-4 mr-2" />
          Trigger Component Error (Will Show Error Boundary)
        </Button>

        <div className="text-sm text-gray-600">
          <p><strong>What will happen:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>The component will throw an error</li>
            <li>The ErrorBoundary will catch it</li>
            <li>You'll see an error fallback UI</li>
            <li>The error will be logged to the frontend error logger</li>
            <li>You can refresh the page to continue</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorBoundaryTestComponent;

