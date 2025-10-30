import axios from 'axios';
import { 
  SeaTableRow, 
  SeaTableColumn, 
  SeaTableTableMetadata,
  SeaTableMetadata,
  MentorMappingOptions,
  SeaTableSelectOption,
  SeaTableRowUpdate
} from '@/types/seaTableTypes';

export interface SeaTableBaseTokenResponse {
  access_token: string;
  dtable_uuid: string;
  dtable_server: string;
  dtable_socket?: string;
  dtable_db?: string;
  workspace_id?: number;
  dtable_name?: string;
  app_name?: string;
}

// Add this helper function OUTSIDE the class, before the SimpleSeaTableClient class definition
const hasOwn = (object: unknown, property: string): boolean =>
  typeof object === 'object' && object !== null && Object.prototype.hasOwnProperty.call(object, property);

const logAxiosError = (context: string, err: unknown) => {
  if (axios.isAxiosError(err)) {
    console.error(context, {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      url: err.config?.url,
      message: err.message,
    });
  } else {
    console.error(context, err);
  }
};

function mapOptionValues(value: unknown, column: SeaTableColumn): unknown {
  const options = Array.isArray(column.data?.options)
    ? (column.data?.options as SeaTableSelectOption[])
    : [];

  if (!value || options.length === 0) {
    return value;
  }

  // Handle single select
  if (column.type === 'single-select' && typeof value === 'string') {
    const option = options.find(opt => opt.id === value);
    return option ? option.name : value;
  }

  // Handle multiple select
  if (column.type === 'multiple-select') {
    if (Array.isArray(value)) {
      return value.map(id => {
        if (typeof id !== 'string') {
          return id;
        }
        const option = options.find(opt => opt.id === id);
        return option ? option.name : id;
      });
    }
    // Sometimes multi-select comes as comma-separated string
    if (typeof value === 'string' && value.includes(',')) {
      const ids = value.split(',').map(id => id.trim());
      return ids.map(id => {
        const option = options.find(opt => opt.id === id);
        return option ? option.name : id;
      });
    }
    // Single ID as string
    if (typeof value === 'string') {
      const option = options.find(opt => opt.id === value);
      return option ? [option.name] : [value];
    }
  }

  // Handle collaborator fields
  if (column.type === 'collaborator' && Array.isArray(value)) {
    return value.map(collab => {
      if (typeof collab === 'string') {
        return collab;
      }

      if (collab && typeof collab === 'object') {
        if ('name' in collab && typeof collab.name === 'string') {
          return collab.name;
        }

        if ('email' in collab && typeof collab.email === 'string') {
          return collab.email;
        }
      }

      return collab;
    });
  }

  return value;
}

// Simple SeaTable client following the exact guide
class SimpleSeaTableClient {
  private apiToken: string;
  private baseToken: string | null = null;
  private dtableUuid: string | null = null;
  private dtableServer: string | null = null;
  private tokenExpiry: Date | null = null;
  private metadata: SeaTableMetadata | null = null;

  constructor(apiToken: string) {
    this.apiToken = apiToken;
    this.loadCachedToken();
  }

  // Load cached token if valid
  private loadCachedToken() {
    try {
      const storedToken = localStorage.getItem('seatable_access_token');
      const storedUuid = localStorage.getItem('seatable_dtable_uuid');
      const storedServer = localStorage.getItem('seatable_dtable_server');
      const storedExpiry = localStorage.getItem('seatable_token_expiry');

      if (storedToken && storedUuid && storedServer && storedExpiry) {
        const expiry = new Date(storedExpiry);
        if (expiry > new Date()) {
          this.baseToken = storedToken;
          this.dtableUuid = storedUuid;
          this.dtableServer = storedServer; // Use exactly what was stored - don't modify
          this.tokenExpiry = expiry;
          
          console.log('[SeaTable] Using cached token, expires:', expiry.toLocaleString());
          console.log('[SeaTable] Cached server URL:', this.dtableServer);
        } else {
          this.clearCache();
        }
      }
    } catch (err: unknown) {
      console.warn('[SeaTable] Error loading cached token:', err);
      this.clearCache();
    }
  }

  // Clear all cached data
  private clearCache() {
    localStorage.removeItem('seatable_access_token');
    localStorage.removeItem('seatable_dtable_uuid');
    localStorage.removeItem('seatable_dtable_server');
    localStorage.removeItem('seatable_token_expiry');
    localStorage.removeItem('seatable_metadata');
    this.baseToken = null;
    this.dtableUuid = null;
    this.dtableServer = null;
    this.tokenExpiry = null;
    this.metadata = null;
  }

  // Step 1: Get access token using API token (following the exact guide)
  private async getAccessToken(): Promise<SeaTableBaseTokenResponse> {
    try {
      console.log('[SeaTable] Getting access token with API token...');
      
      // Make sure we have an API token
      if (!this.apiToken) {
        throw new Error('API token is missing');
      }
      
      const response = await axios.get('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'accept': 'application/json'
        },
        timeout: 10000
      });

      console.log('[SeaTable] Access token response:', response.status);
      console.log('[SeaTable] Response data:', response.data);
      
      if (!response.data?.access_token) {
        console.error('[SeaTable] Invalid response:', response.data);
        throw new Error('No access token in response');
      }

      // Store the response data EXACTLY as returned - don't modify URLs
      this.baseToken = response.data.access_token;
      this.dtableUuid = response.data.dtable_uuid;
      this.dtableServer = response.data.dtable_server;

      // Validate required fields
      if (!this.dtableUuid || !this.dtableServer) {
        throw new Error('Missing required fields in token response');
      }

      // Calculate expiry (3 days from now)
      this.tokenExpiry = new Date();
      this.tokenExpiry.setDate(this.tokenExpiry.getDate() + 3);

      // Cache the data
      localStorage.setItem('seatable_access_token', this.baseToken);
      localStorage.setItem('seatable_dtable_uuid', this.dtableUuid);
      localStorage.setItem('seatable_dtable_server', this.dtableServer);
      localStorage.setItem('seatable_token_expiry', this.tokenExpiry.toISOString());

      console.log('[SeaTable] Token data stored successfully');
      console.log('- dtable_server:', this.dtableServer);
      console.log('- dtable_uuid:', this.dtableUuid);
      console.log('- expires:', this.tokenExpiry.toLocaleString());

      return response.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error('[SeaTable] Error getting access token:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
      } else {
        console.error('[SeaTable] Error getting access token:', err);
      }

      this.clearCache();

      if (axios.isAxiosError(err)) {
        const status = err.response?.status;

        if (status === 401) {
          throw new Error('Invalid API token - please check your VITE_SEATABLE_API_KEY');
        }

        if (status === 403) {
          throw new Error('API token does not have permission to access this base');
        }

        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to SeaTable servers - check your internet connection');
        }

        const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
        throw new Error(`Failed to get access token: ${detail || err.message}`);
      }

      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Failed to get access token: ${message}`);
    }
  }

  // Ensure we have a valid token
  public async ensureValidToken(): Promise<void> {
    const now = new Date();
    
    if (!this.baseToken || !this.dtableUuid || !this.dtableServer || !this.tokenExpiry || now >= this.tokenExpiry) {
      console.log('[SeaTable] Need to refresh token...');
      await this.getAccessToken();
    }
  }

  // Step 2: Fetch table rows - UPDATED FOR API-GATEWAY
  async getTableRows(tableName: string, viewName?: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      console.log('[SeaTable] Fetching rows from table:', tableName, viewName ? `(view: ${viewName})` : '');
      
      // Use the NEW v2 API gateway rows endpoint
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/rows/`;
      
      const params: Record<string, string> = {
        table_name: tableName
      };
      
      if (viewName) {
        params.view_name = viewName;
      }
      
      console.log('[SeaTable] Request URL:', url);
      console.log('[SeaTable] Request params:', params);
      
      const response = await axios.get<{ rows?: SeaTableRow[] } | SeaTableRow[]>(url, {
        params,
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Accept': 'application/json'
        }
      });
      
      const payload = response.data;
      let rows: SeaTableRow[] = [];

      if (Array.isArray(payload)) {
        rows = payload;
      } else if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { rows?: unknown }).rows)
      ) {
        rows = ((payload as { rows?: SeaTableRow[] }).rows) ?? [];
      }

      console.log('[SeaTable] Successfully fetched rows:', rows.length);
      return rows;
      
    } catch (err: unknown) {
      logAxiosError('[SeaTable] Error fetching table rows:', err);
      throw err instanceof Error ? err : new Error('Unknown error fetching table rows');
    }
  }

  // Fix the getFilteredRows method with better debugging
  async getFilteredRows(tableName: string, filterColumn: string, filterValue: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      // Use the NEW v2 API gateway SQL endpoint
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/sql/`;
      
      const requestData = {
        sql: `SELECT * FROM \`${tableName}\` WHERE \`${filterColumn}\` = '${filterValue}'`
      };
      
      console.log('[SeaTable] SQL Query:', requestData.sql);
      console.log('[SeaTable] Looking for:', { filterColumn, filterValue });
      
      const response = await axios.post<{ results?: SeaTableRow[] }>(url, requestData, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const results = response.data.results ?? [];
      console.log('[SeaTable] SQL Query successful, results:', results.length);
      
      // DEBUG: If no results, let's see what columns are available
      if (results.length === 0) {
        console.log('[SeaTable] No results found. Let\'s check what data exists...');
        
        // Try to get just a few rows to see the structure
        const debugSql = `SELECT * FROM \`${tableName}\` LIMIT 5`;
        console.log('[SeaTable] Debug SQL:', debugSql);
        
        try {
          const debugResponse = await axios.post<{ results?: SeaTableRow[] }>(url, { sql: debugSql }, {
            headers: {
              'Authorization': `Bearer ${this.baseToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          
          const debugResults = debugResponse.data.results ?? [];
          console.log('[SeaTable] Sample rows:', debugResults);
          
          if (debugResults.length > 0) {
            console.log('[SeaTable] Available columns:', Object.keys(debugResults[0]));
            console.log('[SeaTable] First row data:', debugResults[0]);
          }
        } catch (debugErr) {
          console.error('[SeaTable] Debug query failed:', debugErr);
        }
      }
      
      return results;
      
    } catch (err: unknown) {
      console.log('[SeaTable] SQL query failed, trying fallback...');
      logAxiosError('[SeaTable] SQL Error details:', err);
      
      // Fallback: Get all rows and filter locally
      try {
        const allRows = await this.getTableRows(tableName);
        console.log('[SeaTable] Fallback: Got', allRows.length, 'total rows');
        
        if (allRows.length > 0) {
          console.log('[SeaTable] Fallback: Sample row columns:', Object.keys(allRows[0]));
          console.log('[SeaTable] Fallback: Looking for', filterColumn, '=', filterValue);
          
          // Check if the column exists
          const hasColumn = Object.keys(allRows[0]).includes(filterColumn);
          console.log('[SeaTable] Fallback: Column', filterColumn, 'exists:', hasColumn);
          
          if (!hasColumn) {
            console.log('[SeaTable] Fallback: Available columns:', Object.keys(allRows[0]));
          }
        }
        
        const filtered = allRows.filter(row => row[filterColumn] === filterValue);
        console.log('[SeaTable] Local filtering successful, filtered rows:', filtered.length);
        return filtered;
      } catch (fallbackErr) {
        console.error('[SeaTable] Both SQL and local filtering failed', fallbackErr);
        return [];
      }
    }
  }

  // Update the getTableRowsWithMapping method to include option value mapping
  async getTableRowsWithMapping(tableName: string, viewName?: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();
      
      console.log('[SeaTable] Fetching rows with mapping from table:', tableName, viewName ? `(view: ${viewName})` : '');
      
      // First get the raw data
      const rawRows = await this.getTableRows(tableName, viewName);
      
      // Get the table structure for mapping
      const tableStructure = await this.getTableStructure(tableName);
      if (!tableStructure) {
        console.warn('[SeaTable] No table structure found, returning raw data');
        return rawRows;
      }
      
      // Map the results to use column names instead of keys AND map option values
      const mappedRows = rawRows.map(row => {
        const mappedRow: SeaTableRow = { _id: row._id };
        
        // Map each column key to its name and convert option IDs to display values
        tableStructure.columns.forEach(column => {
          if (hasOwn(row, column.key)) {
            const rawValue = row[column.key];
            const mappedValue = mapOptionValues(rawValue, column);
            mappedRow[column.name] = mappedValue;
          }
        });
        
        // Keep the special system fields
        ['_id', '_ctime', '_mtime', '_creator', '_last_modifier', '_locked', '_locked_by', '_archived'].forEach(field => {
          if (hasOwn(row, field)) {
            mappedRow[field] = row[field];
          }
        });
        
        return mappedRow;
      });
      
      console.log('[SeaTable] Successfully mapped rows with option values:', mappedRows.length);
      return mappedRows;
      
    } catch (err: unknown) {
      logAxiosError('[SeaTable] Error fetching table rows with mapping:', err);
      throw err instanceof Error ? err : new Error('Unknown error mapping table rows');
    }
  }

  // Also update the getFilteredRowsWithMapping method (Dies ist die geänderte Funktion von oben)
  async getFilteredRowsWithMapping(tableName: string, filterColumn: string, filterValue: string): Promise<SeaTableRow[]> {
    try {
      await this.ensureValidToken();

      console.log(`[SeaTable-Debug] getFilteredRowsWithMapping: Tabelle: '${tableName}', Filterspalte (Name): '${filterColumn}', Filterwert: '${filterValue}'`);

      // 1. Zuerst die Tabellenstruktur (Metadaten) anfordern
      const tableStructure = await this.getTableStructure(tableName);
      if (!tableStructure) {
        console.error(`[SeaTable-Debug] FEHLER: Tabelle '${tableName}' nicht in Metadaten gefunden.`);
        throw new Error(`Tabelle '${tableName}' nicht gefunden.`);
      }

      console.log(`[SeaTable-Debug] Metadaten für Tabelle '${tableName}' geladen. Spaltenanzahl: ${tableStructure.columns.length}`);
      // Zeige alle Spaltennamen und ihre Keys aus den Metadaten an
      console.log(`[SeaTable-Debug] Verfügbare Spalten (Name -> Key):`, 
                    tableStructure.columns.map(c => `${c.name} -> ${c.key}`));

      // 2. Finde den internen SeaTable-Schlüssel (Key) für die gesuchte Spalte
      const columnMapping = tableStructure.columns.find(col => col.name === filterColumn);

      if (!columnMapping) {
        console.error(`[SeaTable-Debug] FEHLER: Spalte '${filterColumn}' wurde NICHT in der Metadaten von Tabelle '${tableName}' gefunden.`);
        // Zeige nochmals alle verfügbaren Spalten, um Vergleich zu erleichtern
        console.log(`[SeaTable-Debug] Tatsächlich verfügbare Spaltennamen:`, tableStructure.columns.map(c => c.name));
        throw new Error(`Spalte '${filterColumn}' nicht in Metadaten gefunden.`);
      }

      const columnKey = columnMapping.key;
      console.log(`[SeaTable-Debug] Spalte '${filterColumn}' (Name) wurde dem internen Key '${columnKey}' zugeordnet.`);

      // 3. Baue die SQL-Abfrage mit dem internen Key
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/sql/`;

      const requestData = {
        sql: `SELECT * FROM \`${tableName}\` WHERE \`${columnKey}\` = '${filterValue}'`
      };

      console.log('[SeaTable-Debug] Folgende SQL-Abfrage wird an SeaTable gesendet:', requestData.sql);

      // 4. Sende die SQL-Abfrage
      const response = await axios.post(url, requestData, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const results = response.data.results || [];
      console.log('[SeaTable-Debug] SQL-Abfrage erfolgreich, Ergebnisse gefunden:', results.length);
      
      // Map the results back to use column names instead of keys AND map option values
      const mappedResults = results.map(resultRow => {
        const typedRow = resultRow as SeaTableRow;
        const mappedRow: SeaTableRow = { _id: typedRow._id };
        
        // Map each column key back to its name and convert option IDs to display values
        tableStructure.columns.forEach(column => {
          if (hasOwn(typedRow, column.key)) {
            const rawValue = typedRow[column.key];
            const mappedValue = mapOptionValues(rawValue, column);
            mappedRow[column.name] = mappedValue;
          }
        });
        
        // Keep the special system fields
        ['_id', '_ctime', '_mtime', '_creator', '_last_modifier', '_locked', '_locked_by', '_archived'].forEach(field => {
          if (hasOwn(typedRow, field)) {
            mappedRow[field] = typedRow[field];
          }
        });
        
        return mappedRow;
      });
      
      console.log('[SeaTable-Debug] Gemappte Ergebnisse mit Optionen:', mappedResults.length);
      return mappedResults;
      
    } catch (err: unknown) {
      console.error('[SeaTable-Debug] SQL-Abfrage mit Mapping fehlgeschlagen, versuche Fallback...');
      logAxiosError('[SeaTable-Debug] Details des SQL-Fehlers:', err);
      
      // Fallback: Get all rows with mapping and filter locally
      try {
        const allRows = await this.getTableRowsWithMapping(tableName);
        console.log('[SeaTable-Debug] Fallback: Habe', allRows.length, 'Gesamtzeilen.');
        
        if (allRows.length > 0) {
          console.log('[SeaTable-Debug] Fallback: Beispielzeile Spalten:', Object.keys(allRows[0]));
          console.log('[SeaTable-Debug] Fallback: Suche nach', filterColumn, '=', filterValue);
          
          // Check if the column exists
          const hasColumn = Object.keys(allRows[0]).includes(filterColumn);
          console.log('[SeaTable-Debug] Fallback: Spalte', filterColumn, 'existiert (clientseitig):', hasColumn);
          
          if (!hasColumn) {
            console.log('[SeaTable-Debug] Fallback: Verfügbare Spalten (clientseitig):', Object.keys(allRows[0]));
          }
        }
        
        const filtered = allRows.filter(row => row[filterColumn] === filterValue);
        console.log('[SeaTable-Debug] Lokale Filterung erfolgreich, gefilterte Zeilen:', filtered.length);
        return filtered;
      } catch (fallbackErr) {
        console.error('[SeaTable-Debug] Sowohl SQL-Abfrage als auch lokale Filterung fehlgeschlagen', fallbackErr);
        return [];
      }
    }
  }

  // Step 3: Get metadata - UPDATED FOR NEW API-GATEWAY ENDPOINTS
  async getMetadata(forceRefresh = false): Promise<SeaTableMetadata> {
    if (this.metadata && !forceRefresh) {
      return this.metadata;
    }

    try {
      await this.ensureValidToken();
      
      // Use the NEW v2 API gateway metadata endpoint
      const metadataUrl = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/metadata/`;
      
      console.log('[SeaTable] Fetching metadata from:', metadataUrl);
      
      const response = await axios.get(metadataUrl, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Accept': 'application/json'
        }
      });

      console.log('[SeaTable] Metadata response status:', response.status);
      
      if (response.data?.metadata) {
        this.metadata = response.data;
      } else {
        // Handle direct metadata format
        this.metadata = {
          metadata: response.data
        };
      }
      
      // Cache metadata
      localStorage.setItem('seatable_metadata', JSON.stringify(this.metadata));
      
      console.log('[SeaTable] Metadata loaded successfully');
      console.log('- Tables:', this.metadata.metadata?.tables?.length || 0);
      
      return this.metadata;
      
    } catch (err: unknown) {
      logAxiosError('[SeaTable] Error fetching metadata:', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      throw new Error(`Failed to fetch metadata: ${message}`);
    }
  }

  // Update a row - UPDATED FOR API-GATEWAY
  async updateRow(tableName: string, rowId: string, data: SeaTableRowUpdate): Promise<boolean> {
    try {
      await this.ensureValidToken();
      
      // Use the NEW v2 API gateway update endpoint
      const url = `https://cloud.seatable.io/api-gateway/api/v2/dtables/${this.dtableUuid}/rows/`;
      
      const requestData = {
        table_name: tableName,
        row_id: rowId,
        row: data
      };
      
      console.log('[SeaTable] Updating row:', requestData);
      
      const response = await axios.put(url, requestData, {
        headers: {
          'Authorization': `Bearer ${this.baseToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('[SeaTable] Update successful');
        return true;
      }
      
      return false;
      
    } catch (err: unknown) {
      logAxiosError('[SeaTable] Error updating row:', err);
      return false;
    }
  }

  // Get table structure
  async getTableStructure(tableName: string): Promise<SeaTableTableMetadata | null> {
    try {
      const metadata = await this.getMetadata();
      return metadata.metadata.tables?.find(t => t.name === tableName) || null;
    } catch (err: unknown) {
      console.error(`[SeaTable] Error getting table structure for ${tableName}:`, err);
      return null;
    }
  }
  // List tables - use metadata endpoint as primary method
  async listTables(): Promise<string[]> {
    try {
      console.log('[SeaTable] Listing tables from metadata...');
      const metadata = await this.getMetadata();
      const tables = metadata.metadata.tables?.map(t => t.name) || [];
      console.log('[SeaTable] Found tables:', tables);
      return tables;
    } catch (err: unknown) {
      console.error('[SeaTable] Error listing tables from metadata:', err);
      return [];
    }
  }

  // Debug info
  getTokenInfo() {
    return {
      hasToken: !!this.baseToken,
      expires: this.tokenExpiry ? this.tokenExpiry.toLocaleString() : 'Not set',
      baseUuid: this.dtableUuid || 'Not set',
      serverUrl: this.dtableServer || 'Not set',
      hasCachedMetadata: !!this.metadata
    };
  }

  // Test connection
  async debugConnection() {
    try {
      console.log('[SeaTable Debug] Testing connection...');
      
      // Test token generation
      await this.getAccessToken();
      console.log('[SeaTable Debug] ✅ Token generation successful');
      
      // Test metadata fetch
      const metadata = await this.getMetadata(true);
      console.log('[SeaTable Debug] ✅ Metadata fetch successful');
      console.log('[SeaTable Debug] Tables found:', metadata.metadata.tables?.length || 0);
      
      // Test table rows fetch
      if (metadata.metadata.tables?.length > 0) {
        const firstTable = metadata.metadata.tables[0].name;
        const rows = await this.getTableRows(firstTable);
        console.log('[SeaTable Debug] ✅ Table rows fetch successful');
        console.log('[SeaTable Debug] Rows in first table:', rows.length);
      }
      
      return { success: true, message: 'All tests passed' };
    } catch (error: unknown) {
      logAxiosError('[SeaTable Debug] ❌ Connection test failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message };
    }
  }

  // Add this method to your SimpleSeaTableClient class
  async testApiToken(): Promise<boolean> {
    try {
      console.log('[SeaTable] Testing API token...');
      console.log('[SeaTable] API token length:', this.apiToken.length);
      console.log('[SeaTable] API token first 10 chars:', this.apiToken.substring(0, 10));
      
      const response = await axios.get('https://cloud.seatable.io/api/v2.1/dtable/app-access-token/', {
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('[SeaTable] API token test successful:', response.status);
      console.log('[SeaTable] Response:', response.data);
      return true;
    } catch (err: unknown) {
      logAxiosError('[SeaTable] API token test failed:', err);
      return false;
    }
  }
}

// Create client instance
const SEATABLE_API_KEY = import.meta.env.VITE_SEATABLE_API_KEY || '';

if (!SEATABLE_API_KEY) {
  console.error('[SeaTable] VITE_SEATABLE_API_KEY environment variable is not set');
}

const simpleClient = new SimpleSeaTableClient(SEATABLE_API_KEY);

// Export a compatible interface
export const seatableClient = {
  // Core methods - UPDATE these to use mapping
  getTableRows: (tableName: string, viewName?: string, forceRefresh = false) => 
    simpleClient.getTableRowsWithMapping(tableName, viewName),
  
  getTableRowsByView: (tableName: string, viewName: string, forceRefresh = false) => 
    simpleClient.getTableRowsWithMapping(tableName, viewName),
  
  getFilteredRows: (tableName: string, filterColumn: string, filterValue: string) => 
    simpleClient.getFilteredRowsWithMapping(tableName, filterColumn, filterValue),
  
  // Keep existing methods unchanged
  getMetadata: (forceRefresh = false) => 
    simpleClient.getMetadata(forceRefresh),
  
  getTableStructure: (tableName: string) => 
    simpleClient.getTableStructure(tableName),
  
  listTables: () => 
    simpleClient.listTables(),
  
  updateRow: (tableName: string, rowId: string, data: SeaTableRowUpdate) => 
    simpleClient.updateRow(tableName, rowId, data),

  // Update convenience methods to use new mapping
  getMentorById: async (mentorId: string, options: { tableName?: string; idField?: string } = {}) => {
    const tableName = options.tableName || 'Neue_MentorInnen';
    const idField = options.idField || 'Mentor_ID';
    
    try {
      const rows = await simpleClient.getFilteredRowsWithMapping(tableName, idField, mentorId);
      return rows.length > 0 ? rows[0] : null;
    } catch (err: unknown) {
      console.error(`[SeaTable] Error getting mentor by ID ${mentorId}:`, err);
      return null;
    }
  },

  updateMentorField: async (mentorId: string, field: string, value: unknown, options: { tableName?: string; idField?: string } = {}) => {
    const tableName = options.tableName || 'Neue_MentorInnen';
    const idField = options.idField || 'Mentor_ID';
    
    try {
      const rows = await simpleClient.getFilteredRowsWithMapping(tableName, idField, mentorId);
      if (rows.length === 0) {
        throw new Error(`Mentor with ID ${mentorId} not found`);
      }
      
      const rowId = rows[0]._id;
      const updatePayload: SeaTableRowUpdate = { [field]: value };
      return await simpleClient.updateRow(tableName, rowId, updatePayload);
    } catch (err: unknown) {
      console.error(`[SeaTable] Error updating mentor field ${field}:`, err);
      return false;
    }
  },

  updateMentor: async (mentorId: string, data: SeaTableRowUpdate, options: { tableName?: string; idField?: string } = {}) => {
    const tableName = options.tableName || 'Neue_MentorInnen';
    const idField = options.idField || 'Mentor_ID';
    
    try {
      const rows = await simpleClient.getFilteredRowsWithMapping(tableName, idField, mentorId);
      if (rows.length === 0) {
        throw new Error(`Mentor with ID ${mentorId} not found`);
      }
      
      const rowId = rows[0]._id;
      return await simpleClient.updateRow(tableName, rowId, data);
    } catch (err: unknown) {
      console.error(`[SeaTable] Error updating mentor:`, err);
      return false;
    }
  },

  // Legacy compatibility methods
  getAxiosInstance: async (forceRefresh = false) => {
    await simpleClient.ensureValidToken();
    return {
      axiosInstance: axios.create({
        headers: {
          'Authorization': `Token ${simpleClient['baseToken']}`,
          'Content-Type': 'application/json'
        }
      }),
      baseUuid: simpleClient['dtableUuid'],
      serverUrl: simpleClient['dtableServer']
    };
  },

  getTokenInfo: () => simpleClient.getTokenInfo(),
  
  debugConnection: () => simpleClient.debugConnection(),

  // Additional methods for compatibility
  detectMentorTable: async () => {
    try {
      const tables = await simpleClient.listTables();
      const preferredTableOrder = ['Neue_MentorInnen', 'Mentors'];
      
      for (const tableName of preferredTableOrder) {
        if (tables.includes(tableName)) {
          const structure = await simpleClient.getTableStructure(tableName);
          if (structure && structure.columns.some(col => col.name === 'Mentor_ID')) {
            return tableName;
          }
        }
      }
      
      return 'Neue_MentorInnen';
    } catch (err: unknown) {
      console.error('[SeaTable] Error detecting mentor table:', err);
      return 'Neue_MentorInnen';
    }
  },

  canMapMentorFields: async (tableName: string, mappingOptions?: MentorMappingOptions) => {
    try {
      const structure = await simpleClient.getTableStructure(tableName);
      if (!structure) return false;
      
      const columnNames = structure.columns.map(c => c.name);
      const idFields = [mappingOptions?.idField, 'Mentor_ID', 'user_id', 'id'].filter(Boolean);
      return idFields.some(field => columnNames.includes(field as string));
    } catch (err: unknown) {
      return false;
    }
  },

  testEndpoints: async () => {
    try {
      const results = await simpleClient.debugConnection();
      // Ensure we always return an array
      return Array.isArray(results) ? results : [results];
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return [{ error: message, success: false }];
    }
  }
};