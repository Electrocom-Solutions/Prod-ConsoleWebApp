"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Camera, Save } from "lucide-react";
import { showSuccess } from "@/lib/sweetalert";

type OwnerProfile = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  photo?: string;
  date_of_birth: string;
  gender: "Male" | "Female";
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  aadhar_number: string;
  pan_number: string;
  username: string;
  created_at: string;
  updated_at: string;
};

const mockOwnerProfile: OwnerProfile = {
  id: 1,
  first_name: "Admin",
  last_name: "User",
  email: "admin@electrocom.com",
  phone: "+91 98765 43210",
  date_of_birth: "1990-01-01",
  gender: "Male",
  address: "123, Andheri West",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400053",
  country: "India",
  aadhar_number: "123456789012",
  pan_number: "ABCDE1234F",
  username: "admin",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<OwnerProfile>(mockOwnerProfile);
  const [formData, setFormData] = useState({
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    phone: profile.phone,
    photo: profile.photo || "",
    date_of_birth: profile.date_of_birth,
    gender: profile.gender,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    pincode: profile.pincode,
    country: profile.country,
    aadhar_number: profile.aadhar_number,
    pan_number: profile.pan_number,
    username: profile.username,
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(profile.photo || null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password change if any password field is filled
    if (formData.current_password || formData.new_password || formData.confirm_password) {
      if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
        await import("@/lib/sweetalert").then(({ showAlert }) =>
          showAlert("Validation Error", "Please fill all password fields to change password")
        );
        return;
      }
      if (formData.new_password !== formData.confirm_password) {
        await import("@/lib/sweetalert").then(({ showAlert }) =>
          showAlert("Validation Error", "New password and confirm password do not match")
        );
        return;
      }
      if (formData.new_password.length < 6) {
        await import("@/lib/sweetalert").then(({ showAlert }) =>
          showAlert("Validation Error", "New password must be at least 6 characters long")
        );
        return;
      }
    }

    const updatedProfile: OwnerProfile = {
      ...profile,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone: formData.phone,
      photo: formData.photo,
      date_of_birth: formData.date_of_birth,
      gender: formData.gender,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      country: formData.country,
      aadhar_number: formData.aadhar_number,
      pan_number: formData.pan_number,
      username: formData.username,
      updated_at: new Date().toISOString(),
    };

    setProfile(updatedProfile);
    await showSuccess("Profile Updated", "Your profile has been updated successfully!");
    
    // Clear password fields after successful update
    setFormData({
      ...formData,
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
  };

  return (
    <DashboardLayout title="Profile" breadcrumbs={["Home", "Profile"]}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">My Profile</h2>
          <p className="text-gray-500 dark:text-gray-400">Update your personal information and account settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Profile Photo</h3>
            <div className="flex items-center gap-6">
              <div className="relative">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-700"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center border-2 border-gray-300 dark:border-gray-700">
                    <User className="h-12 w-12 text-sky-600 dark:text-sky-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center cursor-pointer hover:bg-sky-600 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upload a new profile photo</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB</p>
              </div>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as "Male" | "Female" })}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  City <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  State <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                  required
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Country <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Identity Documents Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Identity Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Aadhar Number
                </label>
                <Input
                  type="text"
                  value={formData.aadhar_number}
                  onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  placeholder="12-digit Aadhar number"
                  maxLength={12}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  PAN Number
                </label>
                <Input
                  type="text"
                  value={formData.pan_number}
                  onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase().slice(0, 10) })}
                  placeholder="10-character PAN number"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* Account Settings Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Username <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="border-t dark:border-gray-800 pt-4">
                <h4 className="text-sm font-semibold mb-4 dark:text-white">Change Password</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Leave blank if you don't want to change your password
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={formData.current_password}
                      onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.new_password}
                      onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <Button type="submit" className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

