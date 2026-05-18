const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();
const PreApprovedStudent = require('../models/PreApprovedStudent');

const seedStudents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const dataPath = path.join(__dirname, '../data/students.json');
    if (!fs.existsSync(dataPath)) {
      console.error('Data file not found at:', dataPath);
      process.exit(1);
    }

    const students = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    console.log(`Seeding ${students.length} students...`);
    
    // Clear existing data (optional, but good for fresh seed)
    await PreApprovedStudent.deleteMany({});
    
    await PreApprovedStudent.insertMany(students);

    console.log('Database seeded successfully! 🌱');
    process.exit();
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedStudents();
