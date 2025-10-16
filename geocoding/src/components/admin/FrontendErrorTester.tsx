import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  Code, 
  Zap, 
  Database, 
  FileText, 
  Globe,
  AlertTriangle,
  Play
} from 'lucide-react';
import { errorLogger } from '@/utils/errorLogger';
import { toast } from 'sonner';
import ErrorBoundaryTestComponent from './ErrorBoundaryTestComponent';

interface FrontendErrorTesterProps {
  onErrorGenerated?: () => void;
}

const FrontendErrorTester: React.FC<FrontendErrorTesterProps> = ({ onErrorGenerated }) => {
  
  const testJavaScriptError = () => {
    try {
      // Simulate a JavaScript runtime error
      const obj: any = null;
      obj.someProperty.nestedProperty = 'test';
    } catch (error) {
      errorLogger.logError('JavaScript runtime error test', error as Error, {
        testType: 'javascript',
        component: 'FrontendErrorTester',
        userAction: 'test_javascript_error'
      });
      
      toast.success('JavaScript error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testTypeError = () => {
    try {
      // Simulate a type error
      const str: string = 'hello';
      const num: number = str as any;
      num.toFixed(2); // This will work but we'll force an error
      
      // Force a type error
      throw new TypeError('Cannot read property of undefined');
    } catch (error) {
      errorLogger.logError('Type error test', error as Error, {
        testType: 'type_error',
        component: 'FrontendErrorTester',
        userAction: 'test_type_error',
        originalValue: 'hello'
      });
      
      toast.success('Type error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testReferenceError = () => {
    try {
      // Simulate a reference error
      throw new ReferenceError('someUndefinedVariable is not defined');
    } catch (error) {
      errorLogger.logError('Reference error test', error as Error, {
        testType: 'reference_error',
        component: 'FrontendErrorTester',
        userAction: 'test_reference_error',
        attemptedVariable: 'someUndefinedVariable'
      });
      
      toast.success('Reference error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testAsyncError = async () => {
    try {
      // Simulate an async operation that fails
      await new Promise((_resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Async operation failed: Network timeout'));
        }, 100);
      });
    } catch (error) {
      errorLogger.logError('Async operation error test', error as Error, {
        testType: 'async_error',
        component: 'FrontendErrorTester',
        userAction: 'test_async_error',
        timeout: 100
      });
      
      toast.success('Async error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testAPICallError = () => {
    try {
      // Simulate an API call error
      throw new Error('Failed to fetch data from /api/nonexistent-endpoint: 404 Not Found');
    } catch (error) {
      errorLogger.logError('API call error test', error as Error, {
        testType: 'api_error',
        component: 'FrontendErrorTester',
        userAction: 'test_api_error',
        endpoint: '/api/nonexistent-endpoint',
        statusCode: 404
      });
      
      toast.success('API error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testPromiseRejection = () => {
    // Simulate an unhandled promise rejection
    Promise.reject(new Error('Unhandled promise rejection test'));
    
    errorLogger.logError('Unhandled promise rejection test', new Error('Unhandled promise rejection test'), {
      testType: 'promise_rejection',
      component: 'FrontendErrorTester',
      userAction: 'test_promise_rejection'
    });
    
    toast.success('Promise rejection generated! Check Frontend Errors tab.');
    onErrorGenerated?.();
  };

  const testCustomError = () => {
    try {
      // Simulate a custom application error
      throw new Error('Custom frontend error: User attempted invalid operation');
    } catch (error) {
      errorLogger.logError('Custom application error test', error as Error, {
        testType: 'custom_error',
        component: 'FrontendErrorTester',
        userAction: 'test_custom_error',
        severity: 'medium',
        userContext: 'admin_panel'
      });
      
      toast.success('Custom error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testMemoryError = () => {
    try {
      // Simulate memory-related error
      const largeArray: string[] = [];
      for (let i = 0; i < 1000000; i++) {
        largeArray.push(`Item ${i} - ${'x'.repeat(1000)}`);
        if (i > 500000) {
          throw new Error('Memory allocation failed: Array too large');
        }
      }
    } catch (error) {
      errorLogger.logError('Memory allocation error test', error as Error, {
        testType: 'memory_error',
        component: 'FrontendErrorTester',
        userAction: 'test_memory_error',
        arraySize: 500000
      });
      
      toast.success('Memory error generated! Check Frontend Errors tab.');
      onErrorGenerated?.();
    }
  };

  const testMultipleErrors = () => {
    const errors = [
      { name: 'Error 1', message: 'First test error', type: 'error_1' },
      { name: 'Error 2', message: 'Second test error', type: 'error_2' },
      { name: 'Error 3', message: 'Third test error', type: 'error_3' }
    ];

    errors.forEach((errorInfo, index) => {
      try {
        throw new Error(`${errorInfo.message} - Multiple errors test`);
      } catch (error) {
        errorLogger.logError(`Multiple errors test - ${errorInfo.name}`, error as Error, {
          testType: 'multiple_errors',
          component: 'FrontendErrorTester',
          userAction: 'test_multiple_errors',
          errorSequence: index + 1,
          totalErrors: errors.length
        });
      }
    });
    
    toast.success('Multiple errors generated! Check Frontend Errors tab.');
    onErrorGenerated?.();
  };

  const testReactComponentError = () => {
    // This will be handled by the ErrorBoundary
    throw new Error('React component error: This is a simulated component error');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-red-500" />
          <span>Frontend Error Testing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Click any button below to generate different types of frontend errors for testing the error logging system.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Button 
            onClick={testJavaScriptError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Code className="h-4 w-4" />
            <span>JavaScript Error</span>
          </Button>

          <Button 
            onClick={testTypeError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Type Error</span>
          </Button>

          <Button 
            onClick={testReferenceError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>Reference Error</span>
          </Button>

          <Button 
            onClick={testAsyncError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Async Error</span>
          </Button>

          <Button 
            onClick={testAPICallError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Globe className="h-4 w-4" />
            <span>API Error</span>
          </Button>

          <Button 
            onClick={testPromiseRejection}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Promise Rejection</span>
          </Button>

          <Button 
            onClick={testCustomError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Bug className="h-4 w-4" />
            <span>Custom Error</span>
          </Button>

          <Button 
            onClick={testMemoryError}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Memory Error</span>
          </Button>

          <Button 
            onClick={testMultipleErrors}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Multiple Errors</span>
          </Button>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Warning:</strong> The "React Component Error" button below will trigger an error boundary. 
            The page will show an error fallback, but you can refresh to continue.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={testReactComponentError}
          variant="destructive"
          size="sm"
          className="w-full"
        >
          <Bug className="h-4 w-4 mr-2" />
          Test React Component Error (Will Show Error Boundary)
        </Button>

        <div className="mt-6">
          <ErrorBoundaryTestComponent />
        </div>
      </CardContent>
    </Card>
  );
};

export default FrontendErrorTester;
