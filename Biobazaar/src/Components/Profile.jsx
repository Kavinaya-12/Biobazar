import React, { useState, useEffect } from "react";
import axios from "axios";
import "./profile.css";
import { api } from "../api";

const Profile = () => {
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  // const user = JSON.parse(localStorage.getItem("user"));
const userId = localStorage.getItem("userId");
const userEmail = localStorage.getItem("userEmail");
console.log("userId from localStorage:", userId);

useEffect(() => {
  if (!userId) return; 

  api.get(`/profile/${userId}`)
    .then(res => {
      setProfileData(res.data.profile);
      setFormData(res.data.profile);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error fetching profile:", err);
      setLoading(false);
    });
}, [userId]);


  const handleEditClick = () => setIsEditing(true);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await api.put(
        `/profile/${userId}`,
        formData
      );
      setProfileData(res.data.profile);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  if (loading) return <p>Loading profile...</p>;
  if (!profileData) return <p>No profile found for this user.</p>;

  return (
    <div className="profile-container">
      <div className="profile-content">
        <h1>{profileData.fullName}'s Profile</h1>
        <img
          src={
            profileData.profilePicture ||
            "https://cdn3.iconfinder.com/data/icons/avatars-flat/33/woman_9-512.png"
          }
          alt={`${profileData.fullName}'s Profile`}
        />
        <p>Email: {userEmail} </p>
        <p>Bio: {profileData.bio}</p>
        <p>Location: {profileData.location}</p>

        {!isEditing ? (
          <button className="edit-button" onClick={handleEditClick}>
            Edit Profile
          </button>
        ) : (
          <div>
            <h2>Edit Profile</h2>
            <form>
              <label>
                Full Name:
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </label>
              <label>
                Bio:
                <input
                  type="text"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                />
              </label>
              <label>
                Location:
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </label>
              <label>
                Profile Picture URL:
                <input
                  type="text"
                  name="profilePicture"
                  value={formData.profilePicture || ""}
                  onChange={handleChange}
                />
              </label>
              <br />
              <button
                type="button"
                className="edit-button"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                type="button"
                className="edit-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;