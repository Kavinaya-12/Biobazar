const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    bio: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    profilePicture: {
        type: String // Assuming you're storing a path to the profile picture
    }
});

const Profile = mongoose.model("Profile", profileSchema);

module.exports = Profile;