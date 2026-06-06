'use server';

export async function syncProgressAction(userId: string, courseId: string, topicSlug: string, completed: boolean) {
  console.log(`[SyncProgress] User ${userId} updated course ${courseId} topic ${topicSlug} completed: ${completed}`);
  return { success: true };
}

export async function syncVideoTimeAction(userId: string, courseId: string, topicSlug: string, time: number) {
  console.log(`[SyncVideoTime] User ${userId} updated course ${courseId} topic ${topicSlug} video time: ${time}s`);
  return { success: true };
}

export async function syncQuizScoreAction(userId: string, courseId: string, topicSlug: string, score: number) {
  console.log(`[SyncQuizScore] User ${userId} updated course ${courseId} topic ${topicSlug} quiz score: ${score}`);
  return { success: true };
}
