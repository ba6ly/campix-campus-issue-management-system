const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Complaint = require('./models/Complaint');
const Notification = require('./models/Notification');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.create({
    name: 'Test User',
    email: `testuser+${Date.now()}@example.com`,
    password: 'password123',
    role: 'student',
    rollNumber: '12345',
    department: 'Computer Science',
  });

  const complaint = await Complaint.create({
    title: 'Test complaint',
    description: 'This is a test description',
    category: 'wifi',
    studentId: user._id,
    isAnonymous: false,
    location: 'Hostel block A',
  });

  const notification = await Notification.create({
    userId: user._id,
    message: 'Your complaint has been received',
    type: 'new_complaint',
    complaintId: complaint._id,
  });

  console.log('Created user:', user._id.toString());
  console.log('Created complaint:', complaint._id.toString());
  console.log('Created notification:', notification._id.toString());

  await Notification.findByIdAndDelete(notification._id);
  await Complaint.findByIdAndDelete(complaint._id);
  await User.findByIdAndDelete(user._id);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});