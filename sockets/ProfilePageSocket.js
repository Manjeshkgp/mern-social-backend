const ProfilePageSocket = (socket) => {
  socket.on("profile_Data", (ProfileDataPosts) => {
    socket.on("like_image", (likedPostData) => {
      let updatedArray = ProfileDataPosts.map((singlePost) => {
        if (singlePost._id === likedPostData.post_id) {
          singlePost?.likesArray.push({ username: likedPostData.userUsername });
          return {
            ...singlePost,
          };
        } else {
          return singlePost;
        }
      });
      socket.emit("newArrayForHome", updatedArray);
      ProfileDataPosts = updatedArray;
    });
    socket.on("unlike_image", (unlikedPostData) => {
      let updatedArray = ProfileDataPosts.map((singlePost) => {
        if (singlePost._id === unlikedPostData.post_id) {
          let newLikesArray = singlePost?.likesArray.filter(
            (obj) => obj.username !== unlikedPostData.userUsername
          );
          return {
            ...singlePost,
            likesArray: newLikesArray,
          };
        } else {
          return singlePost;
        }
      });
      socket.emit("newArrayForHome", updatedArray);
      ProfileDataPosts = updatedArray;
    });
  });
  socket.on("theirProfile_followers",(profileFollowers)=>{
    socket.on("follow_theirProfile",(myUsername)=>{
      profileFollowers.push({username:myUsername});
      socket.emit("new_followers_Array",profileFollowers);
    })
    socket.on("unfollow_theirProfile",(myUsername)=>{
      let updatedProfileFollowers = profileFollowers.filter((obj)=>obj.username!==myUsername);
      profileFollowers = updatedProfileFollowers;
      socket.emit("new_followers_Array",profileFollowers);
    })
  })
};

export default ProfilePageSocket;