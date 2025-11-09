import { Task, TaskResource, TaskAttachment, TaskActivity } from "@/types";

export const mockTasks: Task[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: "Rajesh Kumar",
    client_id: 1,
    client_name: "Smart City Solutions",
    project_id: 1,
    project_name: "Smart City Infrastructure",
    description: "Installation of 15 CCTV cameras at Zone A traffic junction with cable routing",
    date: "2025-11-01",
    location: "Zone A, Traffic Junction, MG Road",
    time_taken_minutes: 480,
    estimated_time_minutes: 420,
    status: "Completed",
    priority: "High",
    assigned_by: "Owner",
    is_new: true,
    created_at: "2025-11-01T09:00:00",
    updated_at: "2025-11-01T17:00:00",
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: "Priya Sharma",
    client_id: 2,
    client_name: "Tech Park Ltd",
    project_id: 2,
    project_name: "IT Park Network Setup",
    description: "Network cabling for Building B - floors 3-5",
    date: "2025-11-01",
    location: "Tech Park, Building B",
    time_taken_minutes: 360,
    estimated_time_minutes: 360,
    status: "Approved",
    priority: "Medium",
    assigned_by: "Owner",
    approved_by: "Admin",
    approved_at: "2025-11-01T19:00:00",
    is_new: false,
    created_at: "2025-11-01T08:30:00",
    updated_at: "2025-11-01T19:00:00",
  },
  {
    id: 3,
    employee_id: 1,
    employee_name: "Rajesh Kumar",
    client_id: 1,
    client_name: "Smart City Solutions",
    project_id: 1,
    project_name: "Smart City Infrastructure",
    description: "Fiber optic cable laying - 500 meters along main corridor",
    date: "2025-10-31",
    location: "Main Corridor, City Center",
    time_taken_minutes: 540,
    estimated_time_minutes: 480,
    status: "In Progress",
    priority: "Urgent",
    assigned_by: "Owner",
    is_new: true,
    created_at: "2025-10-31T07:00:00",
    updated_at: "2025-10-31T16:00:00",
  },
  {
    id: 4,
    employee_id: 3,
    employee_name: "Amit Singh",
    client_id: 3,
    client_name: "Metro Rail Corp",
    project_id: 3,
    project_name: "Metro Station CCTV",
    description: "Installation of DVR and NVR systems at control room",
    date: "2025-10-30",
    location: "Metro Station 5, Control Room",
    time_taken_minutes: 300,
    estimated_time_minutes: 240,
    status: "Completed",
    priority: "High",
    assigned_by: "Owner",
    is_new: false,
    created_at: "2025-10-30T09:00:00",
    updated_at: "2025-10-30T14:00:00",
  },
  {
    id: 5,
    employee_id: 2,
    employee_name: "Priya Sharma",
    client_id: 2,
    client_name: "Tech Park Ltd",
    project_id: 2,
    project_name: "IT Park Network Setup",
    description: "Router configuration and switch setup for Building A",
    date: "2025-10-29",
    location: "Tech Park, Building A, Server Room",
    time_taken_minutes: 240,
    estimated_time_minutes: 240,
    status: "Approved",
    priority: "Medium",
    assigned_by: "Owner",
    approved_by: "Admin",
    approved_at: "2025-10-29T18:00:00",
    is_new: false,
    created_at: "2025-10-29T10:00:00",
    updated_at: "2025-10-29T18:00:00",
  },
  {
    id: 6,
    employee_id: 4,
    employee_name: "Sunita Verma",
    client_id: 4,
    client_name: "Hospital Group",
    project_id: 4,
    project_name: "Hospital Security System",
    description: "Access control installation at main entrance and emergency exits",
    date: "2025-10-28",
    location: "City Hospital, Main Campus",
    time_taken_minutes: 420,
    estimated_time_minutes: 360,
    status: "Completed",
    priority: "High",
    assigned_by: "Owner",
    is_new: true,
    created_at: "2025-10-28T08:00:00",
    updated_at: "2025-10-28T15:00:00",
  },
];

export const mockTaskResources: TaskResource[] = [
  // Task 1 resources
  { id: 1, task_id: 1, resource_name: "CCTV Camera (2MP Bullet)", quantity: 15, unit: "pcs", unit_cost: 3500, total_cost: 52500, created_at: "2025-11-01T09:30:00" },
  { id: 2, task_id: 1, resource_name: "Cat6 Cable", quantity: 200, unit: "m", unit_cost: 25, total_cost: 5000, created_at: "2025-11-01T09:30:00" },
  { id: 3, task_id: 1, resource_name: "Cable Tray", quantity: 50, unit: "m", unit_cost: 150, total_cost: 7500, created_at: "2025-11-01T09:30:00" },
  { id: 4, task_id: 1, resource_name: "Junction Box", quantity: 15, unit: "pcs", unit_cost: 120, total_cost: 1800, created_at: "2025-11-01T09:30:00" },
  
  // Task 2 resources
  { id: 5, task_id: 2, resource_name: "Cat6A Cable", quantity: 500, unit: "m", unit_cost: 35, total_cost: 17500, created_at: "2025-11-01T08:45:00" },
  { id: 6, task_id: 2, resource_name: "RJ45 Connectors", quantity: 100, unit: "pcs", unit_cost: 8, total_cost: 800, created_at: "2025-11-01T08:45:00" },
  { id: 7, task_id: 2, resource_name: "Network Patch Panel", quantity: 3, unit: "pcs", unit_cost: 2500, total_cost: 7500, created_at: "2025-11-01T08:45:00" },
  
  // Task 3 resources
  { id: 8, task_id: 3, resource_name: "Fiber Optic Cable (Single Mode)", quantity: 500, unit: "m", unit_cost: 45, total_cost: 22500, created_at: "2025-10-31T07:30:00" },
  { id: 9, task_id: 3, resource_name: "Fiber Splice Tray", quantity: 10, unit: "pcs", unit_cost: 350, total_cost: 3500, created_at: "2025-10-31T07:30:00" },
  { id: 10, task_id: 3, resource_name: "Conduit Pipe (2 inch)", quantity: 100, unit: "m", unit_cost: 80, total_cost: 8000, notes: "PVC conduit for cable protection", created_at: "2025-10-31T07:30:00" },
  
  // Task 4 resources
  { id: 11, task_id: 4, resource_name: "16 Channel DVR", quantity: 2, unit: "pcs", unit_cost: 12000, total_cost: 24000, created_at: "2025-10-30T09:15:00" },
  { id: 12, task_id: 4, resource_name: "32 Channel NVR", quantity: 1, unit: "pcs", unit_cost: 25000, total_cost: 25000, created_at: "2025-10-30T09:15:00" },
  { id: 13, task_id: 4, resource_name: "Hard Disk (4TB)", quantity: 4, unit: "pcs", unit_cost: 8500, total_cost: 34000, created_at: "2025-10-30T09:15:00" },
  
  // Task 5 resources
  { id: 14, task_id: 5, resource_name: "Enterprise Router", quantity: 2, unit: "pcs", unit_cost: 15000, total_cost: 30000, created_at: "2025-10-29T10:30:00" },
  { id: 15, task_id: 5, resource_name: "Managed Switch (24 Port)", quantity: 3, unit: "pcs", unit_cost: 12000, total_cost: 36000, created_at: "2025-10-29T10:30:00" },
  
  // Task 6 resources (missing unit costs for demonstration)
  { id: 16, task_id: 6, resource_name: "Access Control Panel", quantity: 3, unit: "pcs", notes: "Biometric + RFID", created_at: "2025-10-28T08:30:00" },
  { id: 17, task_id: 6, resource_name: "Magnetic Door Lock", quantity: 5, unit: "pcs", unit_cost: 4500, total_cost: 22500, created_at: "2025-10-28T08:30:00" },
  { id: 18, task_id: 6, resource_name: "RFID Card Reader", quantity: 8, unit: "pcs", created_at: "2025-10-28T08:30:00" },
];

export const mockTaskAttachments: TaskAttachment[] = [
  { id: 1, task_id: 1, file_name: "camera_installation_photo1.jpg", file_url: "/attachments/task1_photo1.jpg", file_type: "image", file_size: 2458624, uploaded_by: "Rajesh Kumar", uploaded_at: "2025-11-01T12:30:00" },
  { id: 2, task_id: 1, file_name: "cable_routing_plan.pdf", file_url: "/attachments/task1_plan.pdf", file_type: "pdf", file_size: 1024000, uploaded_by: "Rajesh Kumar", uploaded_at: "2025-11-01T10:00:00" },
  { id: 3, task_id: 1, file_name: "junction_wiring.jpg", file_url: "/attachments/task1_photo2.jpg", file_type: "image", file_size: 1987456, uploaded_by: "Rajesh Kumar", uploaded_at: "2025-11-01T15:45:00" },
  
  { id: 4, task_id: 2, file_name: "network_floor_plan.pdf", file_url: "/attachments/task2_plan.pdf", file_type: "pdf", file_size: 3145728, uploaded_by: "Priya Sharma", uploaded_at: "2025-11-01T11:00:00" },
  { id: 5, task_id: 2, file_name: "patch_panel_config.jpg", file_url: "/attachments/task2_photo1.jpg", file_type: "image", file_size: 1456789, uploaded_by: "Priya Sharma", uploaded_at: "2025-11-01T14:30:00" },
  
  { id: 6, task_id: 3, file_name: "fiber_splice_documentation.pdf", file_url: "/attachments/task3_doc.pdf", file_type: "pdf", file_size: 987654, uploaded_by: "Rajesh Kumar", uploaded_at: "2025-10-31T10:00:00" },
  { id: 7, task_id: 3, file_name: "cable_route_photo.jpg", file_url: "/attachments/task3_photo1.jpg", file_type: "image", file_size: 3145728, uploaded_by: "Rajesh Kumar", uploaded_at: "2025-10-31T13:00:00" },
  
  { id: 8, task_id: 4, file_name: "dvr_installation.jpg", file_url: "/attachments/task4_photo1.jpg", file_type: "image", file_size: 2234567, uploaded_by: "Amit Singh", uploaded_at: "2025-10-30T11:30:00" },
  
  { id: 9, task_id: 5, file_name: "router_config_backup.pdf", file_url: "/attachments/task5_backup.pdf", file_type: "pdf", file_size: 512000, uploaded_by: "Priya Sharma", uploaded_at: "2025-10-29T12:00:00" },
  { id: 10, task_id: 5, file_name: "network_topology.jpg", file_url: "/attachments/task5_topology.jpg", file_type: "image", file_size: 1876543, uploaded_by: "Priya Sharma", uploaded_at: "2025-10-29T13:30:00" },
  
  { id: 11, task_id: 6, file_name: "access_control_installed.jpg", file_url: "/attachments/task6_photo1.jpg", file_type: "image", file_size: 2567890, uploaded_by: "Sunita Verma", uploaded_at: "2025-10-28T11:00:00" },
  { id: 12, task_id: 6, file_name: "door_lock_testing.jpg", file_url: "/attachments/task6_photo2.jpg", file_type: "image", file_size: 1987654, uploaded_by: "Sunita Verma", uploaded_at: "2025-10-28T13:30:00" },
];

export const mockTaskActivities: TaskActivity[] = [
  // Task 1 activities
  { id: 1, task_id: 1, type: "Created", description: "Task created by Rajesh Kumar", performed_by: "Rajesh Kumar", timestamp: "2025-11-01T09:00:00" },
  { id: 2, task_id: 1, type: "Status Changed", description: "Status changed from Open to In Progress", performed_by: "Rajesh Kumar", timestamp: "2025-11-01T09:15:00" },
  { id: 3, task_id: 1, type: "Resource Updated", description: "Added 4 resources (CCTV cameras, cables, trays)", performed_by: "Rajesh Kumar", timestamp: "2025-11-01T09:30:00" },
  { id: 4, task_id: 1, type: "Status Changed", description: "Status changed from In Progress to Completed", performed_by: "Rajesh Kumar", timestamp: "2025-11-01T17:00:00" },
  
  // Task 2 activities
  { id: 5, task_id: 2, type: "Created", description: "Task created by Priya Sharma", performed_by: "Priya Sharma", timestamp: "2025-11-01T08:30:00" },
  { id: 6, task_id: 2, type: "Edited", description: "Updated resource quantities", performed_by: "Admin", timestamp: "2025-11-01T16:00:00" },
  { id: 7, task_id: 2, type: "Approved", description: "Task approved with payment confirmation", performed_by: "Admin", timestamp: "2025-11-01T19:00:00" },
  
  // Task 3 activities
  { id: 8, task_id: 3, type: "Created", description: "Task assigned to Rajesh Kumar", performed_by: "Owner", timestamp: "2025-10-31T07:00:00" },
  { id: 9, task_id: 3, type: "Status Changed", description: "Status changed from Open to In Progress", performed_by: "Rajesh Kumar", timestamp: "2025-10-31T07:30:00" },
  
  // Task 4 activities
  { id: 10, task_id: 4, type: "Created", description: "Task created by Amit Singh", performed_by: "Amit Singh", timestamp: "2025-10-30T09:00:00" },
  { id: 11, task_id: 4, type: "Status Changed", description: "Status changed from Open to Completed", performed_by: "Amit Singh", timestamp: "2025-10-30T14:00:00" },
  
  // Task 5 activities
  { id: 12, task_id: 5, type: "Created", description: "Task created by Priya Sharma", performed_by: "Priya Sharma", timestamp: "2025-10-29T10:00:00" },
  { id: 13, task_id: 5, type: "Approved", description: "Task approved", performed_by: "Admin", timestamp: "2025-10-29T18:00:00" },
  
  // Task 6 activities
  { id: 14, task_id: 6, type: "Created", description: "Task created by Sunita Verma", performed_by: "Sunita Verma", timestamp: "2025-10-28T08:00:00" },
  { id: 15, task_id: 6, type: "Note Added", description: "Owner added note: Unit costs pending for some resources", performed_by: "Admin", timestamp: "2025-10-28T16:00:00" },
];

// Helper functions
export function getTaskById(id: number): Task | null {
  return mockTasks.find((task) => task.id === id) || null;
}

export function getResourcesByTaskId(taskId: number): TaskResource[] {
  return mockTaskResources.filter((resource) => resource.task_id === taskId);
}

export function getAttachmentsByTaskId(taskId: number): TaskAttachment[] {
  return mockTaskAttachments.filter((attachment) => attachment.task_id === taskId);
}

export function getActivitiesByTaskId(taskId: number): TaskActivity[] {
  return mockTaskActivities.filter((activity) => activity.task_id === taskId);
}

// Calculate total resource cost for a task
export function calculateTaskResourceCost(taskId: number): number {
  const resources = getResourcesByTaskId(taskId);
  return resources.reduce((total, resource) => {
    return total + (resource.total_cost || 0);
  }, 0);
}

// Check if task has missing unit costs
export function hasMissingUnitCosts(taskId: number): boolean {
  const resources = getResourcesByTaskId(taskId);
  return resources.some((resource) => resource.unit_cost === undefined || resource.unit_cost === null);
}
