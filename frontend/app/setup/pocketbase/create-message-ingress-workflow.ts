// app/setup/pocketbase/create-message-ingress-workflow.ts
import { SetupStatus } from './types';

export async function createMessageIngressWorkflow(
  n8nApiKey: string,
  unipileCredentialId: string | null,
  pocketbaseServiceUsername: string,
  pocketbaseServicePassword: string,
  setError: (error: string | null) => void,
  unipileDsn: string | null = null,
  unipileAccountId: string | null = null // Add this parameter
): Promise<boolean> {
  try {
    console.log("Creating message ingress workflow in n8n...");
    
    if (!unipileCredentialId) {
      throw new Error('Missing Unipile credential ID');
    }
    
    // Define workflow to import
    const workflow = {
      name: "New message ingress [linkedout]",
      filename: "new-message-ingress"
    };
    
    // Process the DSN URL to ensure it has https:// prefix if needed
    let unipileDsnUrl = unipileDsn || process.env.UNIPILE_DSN_URL || "";
    if (unipileDsnUrl && !unipileDsnUrl.startsWith('https://') && !unipileDsnUrl.startsWith('http://')) {
      unipileDsnUrl = `https://${unipileDsnUrl}`;
    }
    
    // Get account ID from parameter or localStorage
    const accountId = unipileAccountId || localStorage.getItem('unipileAccountId') || "";
      // Get PocketBase URL and modify for Docker if needed
      let pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || "";
      if (pocketbaseUrl.includes("localhost") || pocketbaseUrl.includes("127.0.0.1")) {
        pocketbaseUrl = pocketbaseUrl.replace("localhost", "pocketbase").replace("127.0.0.1", "pocketbase");
        console.log("Modified PocketBase URL for Docker network:", pocketbaseUrl);
      }
      
    // Define replacements map with the account ID
    const replacements = {
      "****POCKETBASE_BASE_URL****": pocketbaseUrl,
      "****UNIPILE_CREDENTIAL_ID****": unipileCredentialId,
      "****POCKETBASE_SERVICE_USER_EMAIL****": "linkedout-service-user@n8n.io",
      "****POCKETBASE_SERVICE_USER_PASSWORD****": pocketbaseServicePassword,
      "****UNIPILE_DSN_URL****": unipileDsnUrl,
      "****UNIPILE_ACCOUNT_ID****": accountId
    };
    
    console.log("Using replacements:", {
      "POCKETBASE_BASE_URL": process.env.NEXT_PUBLIC_POCKETBASE_URL || "",
      "UNIPILE_CREDENTIAL_ID": unipileCredentialId,
      "POCKETBASE_SERVICE_USER_EMAIL": "linkedout-service-user@n8n.io",
      "UNIPILE_DSN_URL": unipileDsnUrl
    });
    
    // Fetch the workflow template
    const response = await fetch(`/workflows/${workflow.filename}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load workflow file: ${workflow.filename}.json`);
    }
    
    let workflowData = await response.json();
    
    // Convert workflow to string for replacements
    let workflowStr = JSON.stringify(workflowData);
    
    // Apply all replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      workflowStr = workflowStr.split(placeholder).join(value);
    }
    
    // Parse back to object
    workflowData = JSON.parse(workflowStr);
    
    // Create a clean workflow object
    const cleanWorkflow = {
      name: workflow.name,
      nodes: workflowData.nodes || [],
      connections: workflowData.connections || {},
      settings: {
        saveExecutionProgress: true,
        saveManualExecutions: true,
        saveDataErrorExecution: "all",
        saveDataSuccessExecution: "all",
        executionTimeout: 3600,
        timezone: "UTC"
      }
    };
    
    // Import the workflow
    const importResponse = await fetch('/api/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service': 'n8n',
        'x-endpoint': 'api/v1/workflows',
        'x-n8n-api-key': n8nApiKey
      },
      body: JSON.stringify(cleanWorkflow),
    });

    if (!importResponse.ok) {
      const errorData = await importResponse.json().catch(() => ({}));
      console.error(`Failed to import workflow ${workflow.name}:`, errorData);
      throw new Error(errorData.message || `Failed to import workflow: ${workflow.name}`);
    }
    
    // Get the workflow ID from the response
    const importData = await importResponse.json();
    const workflowId = importData.id;
    
    if (!workflowId) {
      console.error(`No workflow ID returned for ${workflow.name}`);
      throw new Error(`Failed to get workflow ID for: ${workflow.name}`);
    }
    
    // Activate the workflow using the n8n API
    console.log(`Activating workflow: ${workflow.name} (ID: ${workflowId})`);
    const activateResponse = await fetch('/api/setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service': 'n8n',
        'x-endpoint': `api/v1/workflows/${workflowId}/activate`,
        'x-n8n-api-key': n8nApiKey
      },
      body: JSON.stringify({}),
    });
    
    if (!activateResponse.ok) {
      const errorText = await activateResponse.text();
      let errorMessage = `Failed to activate workflow: ${workflow.name}`;
      
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // If we can't parse the error as JSON, use the raw text
        errorMessage = `${errorMessage} - ${errorText}`;
      }
      
      console.error(`Failed to activate workflow ${workflow.name}:`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log(`Successfully created and activated message ingress workflow in n8n`);
    return true;
  } catch (error) {
    console.error('Error creating message ingress workflow:', error);
    setError(error instanceof Error ? error.message : 'Failed to create message ingress workflow in n8n');
    return false;
  }
}