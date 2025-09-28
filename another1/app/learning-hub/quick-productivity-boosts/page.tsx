'use client';

import React from 'react';
import CourseTemplate from '@/components/learning-hub/course-template';
import { lessons } from './lessonsData';

export default function QuickProductivityBoosts() {
  return (
    <CourseTemplate
      courseName="Quick Productivity Boosts"
      lessons={lessons}
    />
  );
}
