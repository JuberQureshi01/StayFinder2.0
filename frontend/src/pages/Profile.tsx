import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  UserCircle2,
  Loader2,
  Mail,
  Shield,
  Check,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { RootState } from "../app/store";
import { setCredentials } from "../features/auth/authSlice";
import apiFetch from "../services/apiFetch";


const Profile = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load existing data
  useEffect(() => {
    if (user) {
      setName((user as any).profile?.name || (user as any).name || "");
      setAvatarPreview((user as any).profile?.profilePicture || null);
    }
  }, [user]);

  // Handle local file selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Basic validation: max 5MB
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("Image must be smaller than 5MB");
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file)); // Generate temporary local preview
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      // Because we are sending a File, we MUST use FormData instead of standard JSON
      const formData = new FormData();
      formData.append("name", name);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Explicitly set the headers for multipart form data
      const response = await apiFetch.put("/users/profile", formData);

      dispatch(
        setCredentials({
          user: response.data.user,
          token: token,
        }),
      );

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Personal info</h1>
          <p className="text-gray-500 mt-2">
            Manage your personal details and account settings.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Card with Image Upload Overlay */}
          <div className="p-6 sm:p-8 flex items-start gap-6 border-b border-gray-100">
            {/* The Clickable Avatar Container */}
            <div
              onClick={() => document.getElementById("avatar-upload")?.click()}
              className="group relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-full bg-gray-100 flex items-center justify-center border-2 border-transparent transition-colors hover:border-gray-300 shadow-sm"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserCircle2 className="h-12 w-12 text-gray-400" />
              )}

              {/* Hover Dark Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>

              {/* Hidden File Input */}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {(user as any).profile?.name || (user as any).name || "User"}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <Mail className="h-4 w-4" />
                <span className="text-sm">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <Shield className="h-4 w-4" />
                <span className="text-sm capitalize">
                  {user?.role || "Guest"} Account
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">
                  Legal Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-900">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-500 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end border-t border-gray-100">
              <button
                type="submit"
                disabled={isUpdating || (!name.trim() && !avatarFile)}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-black disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Profile;
