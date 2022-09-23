import Video from "../models/Video";

export const home = async (req, res) => {
  const videos = await Video.find({});
  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params; //해당 페이지의 url에서 받아온(videoRouter.js) id로 DB를 불러 올 수 있음
  const video = await Video.findById(id);
  if (video) {
    //video가 있을 경우
    return res.render("watch", { pageTitle: video.title, video });
  }
  //video가 없는 경우
  return res.render("404", { pageTitle: "Video not found" });
};

export const getEdit = (req, res) => {
  const { id } = req.params;
  return res.render("edit", { pageTitle: `Editing: ` });
};

export const postEdit = (req, res) => {
  const { id } = req.params;
  const title = req.body.title;
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("Upload", { pageTitle: "Upload Video" });
};

export const postUpload = async (req, res) => {
  try {
    const { title, description, hashtags } = req.body;
    await Video.create({
      title,
      description,
      hashtags: hashtags.split(",").map((word) => `#${word}`),
    });
    return res.redirect("/");
  } catch (error) {
    return res.render("Upload", {
      pageTitle: "Upload Video",
      errorMessage: error._message,
    });
  }
};
