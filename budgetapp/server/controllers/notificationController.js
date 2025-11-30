import asyncHandler from "express-async-handler";
import Notification from "../models/Notification.js";

// GET /api/notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const filter = req.query.user ? { user: req.query.user } : {};
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json(notifications);
});

// GET /api/notifications/:id
export const getNotificationById = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id).lean();
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.status(200).json(notification);
});

// POST /api/notifications
export const createNotification = asyncHandler(async (req, res) => {
  const { user, title, message, type, data, read, read_at, delivered_at, expires_at } = req.body;

  if (!user || !title || !message) {
    return res.status(400).json({ message: "User, title, and message are required" });
  }

  const notification = await Notification.create({
    user,
    title,
    message,
    type,
    data,
    read,
    read_at,
    delivered_at,
    expires_at
  });

  res.status(201).json(notification);
});

// PUT /api/notifications/:id
export const updateNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  const { user, title, message, type, data, read, read_at, delivered_at, expires_at } = req.body;
  if (user !== undefined) notification.user = user;
  if (title !== undefined) notification.title = title;
  if (message !== undefined) notification.message = message;
  if (type !== undefined) notification.type = type;
  if (data !== undefined) notification.data = data;
  if (read !== undefined) notification.read = read;
  if (read_at !== undefined) notification.read_at = read_at;
  if (delivered_at !== undefined) notification.delivered_at = delivered_at;
  if (expires_at !== undefined) notification.expires_at = expires_at;

  await notification.save();
  res.status(200).json(notification);
});

// DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findById(id);
  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  await notification.deleteOne();
  res.status(200).json({ message: "Notification deleted" });
});
