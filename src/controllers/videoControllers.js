let videos = [
  {
    title: "Bello!",
    rating: 5,
    comments: 2,
    createdAt: "2 minute ago",
    views: 1,
    id: 1,
  },
  {
    title: "🎉My first video🎉",
    rating: 5,
    comments: 34,
    createdAt: "2 minute ago",
    views: 204,
    id: 2,
  },
  {
    title: "Long time no seeeeee😎",
    rating: 5,
    comments: 78,
    createdAt: "2 minute ago",
    views: 48,
    id: 3,
  },
];

export const trending = (req, res) => {
  return res.render("home", { pageTitle: "Home", videos });
};

export const watch = (req, res) => {
  const { id } = req.params;
  const video = videos[id - 1];
  return res.render("watch", { pageTitle: `Watching ${video.title}`, video });
};

export const getEdit = (req, res) => {
  const { id } = req.params;
  const video = videos[id - 1];
  return res.render("edit", { pageTitle: `Editing: ${video.title}`, video });
};

export const postEdit = (req, res) => {
  const { id } = req.params;
  const title = req.body.title;
  videos[id - 1].title = title;
  return res.redirect(`/videos/${id}`);
};
