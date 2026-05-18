import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword } from "../services/api";
import { FaUserCircle, FaLock, FaEnvelope } from "react-icons/fa";

function Profile() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    country: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      country: user.country || "India",
    });
  }, [user]);

  const onProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSavingProfile(true);

    try {
      const { email, ...updatableFields } = profileForm;
      await updateProfile(updatableFields);
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password must match");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed. Please login again.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to change password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-300">Manage your personal information and security.</p>
      </div>

      {/* ─── Avatar + Name Banner ─────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 shadow-sm dark:border-slate-700">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm">
            <FaUserCircle className="text-5xl" />
          </div>
          <div className="text-white">
            <h2 className="text-xl font-bold">{user?.firstName || "User"} {user?.lastName || ""}</h2>
            <p className="flex items-center gap-2 text-sm text-blue-100">
              <FaEnvelope className="text-xs" /> {user?.email || ""}
            </p>
            <p className="mt-1 text-xs text-blue-200">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—"}</p>
          </div>
        </div>
      </section>

      {/* ─── Personal Info ────────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <FaUserCircle className="text-blue-500" /> Personal Information
        </h2>
        <form onSubmit={saveProfile} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">First Name</label>
            <input
              name="firstName"
              value={profileForm.firstName}
              onChange={onProfileChange}
              placeholder="First name"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Last Name</label>
            <input
              name="lastName"
              value={profileForm.lastName}
              onChange={onProfileChange}
              placeholder="Last name"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Email Address</label>
            <div className="relative">
              <input
                name="email"
                type="email"
                value={profileForm.email}
                readOnly
                disabled
                className="w-full rounded-lg border border-slate-200 bg-slate-100 p-2.5 text-sm text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                Locked
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Email cannot be changed after registration.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Country</label>
            <input
              name="country"
              value={profileForm.country}
              onChange={onProfileChange}
              placeholder="Country"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 transition-colors"
            >
              {isSavingProfile ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* ─── Change Password ──────────────────────────────────────────── */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          <FaLock className="text-rose-500" /> Security
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Change your password to keep your account secure.</p>
        <form onSubmit={updatePassword} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Current Password</label>
            <input
              type="password"
              name="currentPassword"
              value={passwordForm.currentPassword}
              onChange={onPasswordChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={onPasswordChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={onPasswordChange}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300 transition-colors"
            >
              {isUpdatingPassword ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Profile;
