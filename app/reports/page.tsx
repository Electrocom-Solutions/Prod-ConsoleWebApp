"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, BarChart3, TrendingUp, FileSpreadsheet, X } from "lucide-react";
import { showAlert } from "@/lib/sweetalert";

const reportTypes = [
  {
    id: "amc-billing",
    title: "AMC Billing Summary",
    description: "Overview of AMC billing and outstanding receivables",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    id: "payroll",
    title: "Payroll Summary",
    description: "Monthly payroll costs and employee payments",
    icon: BarChart3,
    color: "text-green-600",
  },
  {
    id: "tasks",
    title: "Tasks by Employee",
    description: "Employee productivity and task completion metrics",
    icon: TrendingUp,
    color: "text-sky-600",
  },
  {
    id: "tender",
    title: "Tender Pipeline",
    description: "Tender status, success rate, and bid analysis",
    icon: FileSpreadsheet,
    color: "text-purple-600",
  },
  {
    id: "outstanding",
    title: "Outstanding Receivables",
    description: "Pending payments and aging analysis",
    icon: FileText,
    color: "text-red-600",
  },
];

export default function ReportsPage() {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const handleGenerateReport = (reportId: string) => {
    setSelectedReport(reportId);
    setShowReportModal(true);
  };

  return (
    <DashboardLayout title="Reports & Analytics" breadcrumbs={["Home", "Reports"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Pre-built Reports</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Generate insights and export data for analysis
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleGenerateReport(report.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${report.color}`} />
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.description}
                  </p>
                  <Button
                    className="w-full mt-4"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateReport(report.id);
                    }}
                  >
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {showReportModal && selectedReport && (
        <ReportModal
          reportId={selectedReport}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </DashboardLayout>
  );
}

function ReportModal({ reportId, onClose }: { reportId: string; onClose: () => void }) {
  const report = reportTypes.find((r) => r.id === reportId);
  const [format, setFormat] = useState("pdf");
  const [dateRange, setDateRange] = useState("this-month");

  const handleExport = async () => {
    await showAlert(
      "Report Generated!",
      `Report: ${report?.title}\nFormat: ${format.toUpperCase()}\nDate Range: ${dateRange}\n\nIn production, this would generate the report and download it automatically.`,
      "success"
    );
    onClose();
  };

  const mockData = {
    "amc-billing": [
      { client: "BSNL", amount: 125000, status: "Paid" },
      { client: "DataNet Solutions", amount: 45000, status: "Pending" },
      { client: "PowerGrid", amount: 89000, status: "Paid" },
      { client: "TechCorp", amount: 67000, status: "Overdue" },
    ],
    payroll: [
      { employee: "Rajesh Kumar", amount: 38221, status: "Paid" },
      { employee: "Priya Sharma", amount: 28328, status: "Pending" },
      { employee: "Amit Patel", amount: 48760, status: "Pending" },
      { employee: "Suresh Reddy", amount: 22000, status: "Paid" },
    ],
    tasks: [
      { employee: "Rajesh Kumar", completed: 24, pending: 3, rate: "89%" },
      { employee: "Amit Patel", completed: 18, pending: 5, rate: "78%" },
      { employee: "Suresh Reddy", completed: 21, pending: 2, rate: "91%" },
    ],
    tender: [
      { name: "BSNL Network Expansion", status: "Awarded", value: 2500000 },
      { name: "Railway Signaling", status: "Filed", value: 1800000 },
      { name: "Airport Infrastructure", status: "Lost", value: 3200000 },
    ],
    outstanding: [
      { client: "DataNet Solutions", amount: 45000, days: 15 },
      { client: "TechCorp", amount: 67000, days: 45 },
      { client: "GlobalNet Inc", amount: 32000, days: 7 },
    ],
  };

  const data = mockData[reportId as keyof typeof mockData] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-800">
          <div>
            <h2 className="text-xl font-semibold">{report?.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{report?.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="this-quarter">This Quarter</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="this-year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Export Format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Report Preview</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      {Object.keys(data[0] || {}).map((key) => (
                        <th key={key} className="text-left p-2 font-medium capitalize">
                          {key.replace("_", " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row: any, idx) => (
                      <tr key={idx} className="border-b dark:border-gray-700">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="p-2">
                            {typeof value === "number" && value > 1000
                              ? `₹${value.toLocaleString()}`
                              : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t dark:border-gray-800">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
}
