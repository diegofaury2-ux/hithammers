export type UserProfile = 'admin' | 'member';
export type ProjectPriority = 'critical' | 'high' | 'medium' | 'low';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type ProjectType = 'branding' | 'campanha_digital' | 'growth' | 'eventos';
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'overdue';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

export interface User {
  id: string;
  name: string;
  email: string | null;
  profile: UserProfile;
  roleTitle: string | null;
  avatarUrl: string | null;
  isOnline?: boolean;
  mustChangePassword?: boolean;
  createdAt?: string;
  lastLogin?: string | null;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  createdAt: string;
  members?: { teamId: string; userId: string; user: User }[];
}

export interface Client {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProjectTeam {
  projectId: string;
  teamId: string;
  team: Team;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  whatWhy: string | null;
  howWhere: string | null;
  budget: number | null;
  clientId: string | null;
  client: Client | null;
  projectType: ProjectType | null;
  priority: ProjectPriority;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  completionPct: number;
  createdById: string;
  createdAt: string;
  archivedAt: string | null;
  deletedAt: string | null;
  projectTeams: ProjectTeam[];
  _count?: { tasks: number };
  tasks?: Task[];
}

export interface TaskAssignee {
  taskId: string;
  userId: string;
  user: { id: string; name: string; avatarUrl: string | null };
}

export interface TaskChecklistItem {
  id: string;
  taskId: string;
  parentItemId: string | null;
  text: string;
  isDone: boolean;
  order: number;
  subitems?: TaskChecklistItem[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  isAdminOnly: boolean;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null; profile: UserProfile };
}

export interface TaskDependency {
  dependentTaskId: string;
  dependencyTaskId: string;
  dependencyTask?: { id: string; title: string; status: TaskStatus };
  dependentTask?: { id: string; title: string; status: TaskStatus };
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  tags: string[];
  timeSpentMinutes: number | null;
  completedAt: string | null;
  createdById: string;
  createdAt: string;
  deletedAt: string | null;
  assignees: TaskAssignee[];
  checklistItems: TaskChecklistItem[];
  comments: TaskComment[];
  dependsOn: TaskDependency[];
  dependedOnBy: TaskDependency[];
  createdBy?: { id: string; name: string };
}

export interface DashboardSummary {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  completionRate: number;
  completionsByDay: { date: string; count: number }[];
  criticalTasks: Task[];
  priorityDist: { priority: TaskPriority; _count: number }[];
  byAssignee: { userId: string; name: string; count: number }[];
}
