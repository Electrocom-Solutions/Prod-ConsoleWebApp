"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { User, Camera, Save, Loader2 } from "lucide-react";
import { showSuccess, showError, showAlert } from "@/lib/sweetalert";
import { apiClient, CurrentUserProfile, CurrentUserProfileUpdateData } from "@/lib/api";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProfilePage() {
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    photo: null as File | null,
    date_of_birth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pin_code: "",
    country: "",
    aadhar_number: "",
    pan_number: "",
    username: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadharCardInputRef = useRef<HTMLInputElement>(null);
  const panCardInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const profileData = await apiClient.getCurrentUserProfile();
        setProfile(profileData);
        setFormData({
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          email: profileData.email || "",
          phone_number: profileData.phone_number || "",
          photo: null,
          date_of_birth: profileData.date_of_birth || "",
          gender: profileData.gender || "",
          address: profileData.address || "",
          city: profileData.city || "",
          state: profileData.state || "",
          pin_code: profileData.pin_code || "",
          country: profileData.country || "",
          aadhar_number: profileData.aadhar_number || "",
          pan_number: profileData.pan_number || "",
          username: profileData.username || "",
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setPhotoPreview(profileData.photo_url || null);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        showAlert("File Too Large", "Profile photo must be less than 2MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showAlert("Invalid File Type", "Please select an image file");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData({ ...formData, photo: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate password change if any password field is filled
      if (formData.current_password || formData.new_password || formData.confirm_password) {
        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
          await showAlert("Validation Error", "Please fill all password fields to change password");
          setIsSaving(false);
          return;
        }
        if (formData.new_password !== formData.confirm_password) {
          await showAlert("Validation Error", "New password and confirm password do not match");
          setIsSaving(false);
          return;
        }
        if (formData.new_password.length < 6) {
          await showAlert("Validation Error", "New password must be at least 6 characters long");
          setIsSaving(false);
          return;
        }
      }

      // Prepare update data
      const updateData: CurrentUserProfileUpdateData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        photo: formData.photo,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        pin_code: formData.pin_code || null,
        country: formData.country || null,
        aadhar_number: formData.aadhar_number || null,
        pan_number: formData.pan_number || null,
        phone_number: formData.phone_number || null,
      };

      // Add password fields only if provided
      if (formData.current_password && formData.new_password && formData.confirm_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
        updateData.confirm_password = formData.confirm_password;
      }

      // Update profile
      const updatedProfile = await apiClient.updateCurrentUserProfile(updateData);
      setProfile(updatedProfile);
      setPhotoPreview(updatedProfile.photo_url || null);
      
      // Clear password fields after successful update
      setFormData({
        ...formData,
        current_password: "",
        new_password: "",
        confirm_password: "",
        photo: null, // Reset photo file after upload
      });
      
      // Reset file inputs
      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }

      await showSuccess("Profile Updated", "Your profile has been updated successfully!");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      const errorMessage = err.error || err.message || "Failed to update profile";
      await showError("Error", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Profile" breadcrumbs={["Home", "Profile"]}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (error && !profile) {
    return (
      <DashboardLayout title="Profile" breadcrumbs={["Home", "Profile"]}>
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-red-400 text-red-600">
          <p className="text-lg font-medium">Error: {error}</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout title="Profile" breadcrumbs={["Home", "Profile"]}>
        <div className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

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
                    // eslint-disable-next-line @next/next/no-img-element
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
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      disabled={isSaving}
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
                    disabled={isSaving}
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
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Date of Birth <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    value={formData.date_of_birth || undefined}
                    onChange={(value) => setFormData({ ...formData, date_of_birth: value })}
                    placeholder="Select date of birth"
                    required
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    required
                    disabled={isSaving}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Gender</option>
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
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, '') })}
                    required
                    disabled={isSaving}
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
                    disabled={isSaving}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    disabled={isSaving}
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
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.pin_code}
                    onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    required
                    maxLength={6}
                    disabled={isSaving}
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
                    disabled={isSaving}
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
                    disabled={isSaving}
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
                    disabled={isSaving}
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
                    disabled={isSaving}
                  />
                </div>
                <div className="border-t dark:border-gray-800 pt-4">
                  <h4 className="text-sm font-semibold mb-4 dark:text-white">Change Password</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Leave blank if you don&apos;t want to change your password
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
                        disabled={isSaving}
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
                        disabled={isSaving}
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
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button type="submit" className="inline-flex items-center gap-2" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
