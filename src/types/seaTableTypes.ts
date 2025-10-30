import { UserRole } from '@/types/auth';

// Column metadata from SeaTable API
export interface ColumnMetadata {
  [fieldName: string]: {
    type: string;
    key: string;
    name: string;
  };
}

export interface SeaTableSelectOption {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface SeaTableColumnData {
  options?: SeaTableSelectOption[];
  [key: string]: unknown;
}

// SeaTable row data
export interface SeaTableRow {
  _id: string;
  [key: string]: unknown;
}

export interface SeaTableViewMetadata {
  name?: string;
  view_name?: string;
  [key: string]: unknown;
}

// Table structure metadata
export interface SeaTableColumn {
  key: string;
  name: string;
  type: string;
  width: number;
  editable: boolean;
  data?: SeaTableColumnData;
  [key: string]: unknown;
}

export interface SeaTableTableMetadata {
  _id: string;
  name: string;
  columns: SeaTableColumn[];
  views: SeaTableViewMetadata[];
  [key: string]: unknown;
}

// Main metadata interface
export interface SeaTableMetadata {
  metadata: {
    tables: SeaTableTableMetadata[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// SeaTable API response types
export interface SeaTableBaseTokenResponse {
  access_token: string;
  dtable_uuid: string;
  dtable_server: string;
  dtable_socket: string;
  dtable_db: string;
  workspace_id: number;
  dtable_name: string;
}

// Component prop interfaces - REMOVED currentUserRole and supabaseUserData
export interface SeaTableProfileDataProps {
  data: SeaTableRow;
  isLoading: boolean;
  language: 'en' | 'de';
  userId?: string;
  canEdit?: boolean;
  columnMetadata?: ColumnMetadata;
}

// Mentor-specific types
export interface MentorProfile {
  id: string;
  Mentor_ID?: string;
  Vorname?: string;
  Nachname?: string;
  [key: string]: unknown;
}

export type SeaTableRowUpdate = Record<string, unknown>;

// Hook options
export interface UseSeatableMentorsOptions {
  tableName?: string;
  idField?: string;
  viewName?: string;
}

// Field mapping types
export interface MentorMappingOptions {
  idField?: string;
  firstNameField?: string;
  lastNameField?: string;
  displayNameField?: string;
  emailField?: string;
  quoteField?: string;
  descriptionField?: string;
  profileImageField?: string;
}