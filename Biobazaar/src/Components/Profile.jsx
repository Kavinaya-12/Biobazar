import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import "./profile.css";
import { api } from "../api";

const Profile = () => {

  const userId = useSelector((state) => state.auth.userId);

  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    location: "",
    profilePicture: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {

    if (!userId) return;

    fetchProfile();

  }, [userId]);

  const fetchProfile = async () => {

    try {

      const res = await api.get(`/profile/${userId}`);

      if (res.data.success) {

        setProfileData(res.data.profile);

        setFormData(res.data.profile);

      }

    } catch (err) {

      console.log(err);

    } finally {

      setLoading(false);

    }

  };

  const handleChange = (e) => {

    setFormData({

      ...formData,

      [e.target.name]: e.target.value,

    });

  };

  const handleSave = async () => {

    try {

      const res = await api.put(`/profile/${userId}`, formData);

      if (res.data.success) {

        setProfileData(res.data.profile);

        setFormData(res.data.profile);

        setIsEditing(false);

        alert("Profile Updated Successfully");

      }

    } catch (err) {

      console.log(err);

      alert("Unable to update profile");

    }

  };

  if (loading)

    return <h2 style={{ textAlign: "center" }}>Loading...</h2>;

  if (!profileData)

    return <h2 style={{ textAlign: "center" }}>Profile Not Found</h2>;

  return (
    <div className="profile-container">

      <div className="profile-content">

        <h1>{profileData.fullName}</h1>

        <img
          src={
            profileData.profilePicture
              ? profileData.profilePicture
              : "https://cdn3.iconfinder.com/data/icons/avatars-flat/33/woman_9-512.png"
          }
          alt="profile"
        />

        <p>

          <strong>Email :</strong> {userEmail}

        </p>

        <p>

          <strong>Bio :</strong> {profileData.bio}

        </p>

        <p>

          <strong>Location :</strong> {profileData.location}

        </p>

        {!isEditing ? (

          <button
            className="edit-button"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>

        ) : (

          <>

            <label>

              Full Name

              <input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />

            </label>

            <label>

              Bio

              <input
                name="bio"
                value={formData.bio}
                onChange={handleChange}
              />

            </label>

            <label>

              Location

              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
              />

            </label>

            <label>

              Profile Picture URL

              <input
                name="profilePicture"
                value={formData.profilePicture || ""}
                onChange={handleChange}
              />

            </label>

            <br />

            <button
              className="edit-button"
              onClick={handleSave}
            >
              Save
            </button>

            <button
              className="edit-button"
              onClick={() => {
                setFormData(profileData);
                setIsEditing(false);
              }}
            >
              Cancel
            </button>

          </>

        )}

      </div>

    </div>
  );
};

export default Profile;