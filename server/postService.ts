// Service for post-related business logic
import { callBlockchainCore } from './blockchain';

export class PostService {
  static async createPost(postData: any, file: any, userId: string) {
    // Calculate mining reward based on content type
    let reward = 25; // Base reward
    if (postData.postType === 'meme') reward = 45;
    if (postData.postType === 'memory') reward = 67;
    if (postData.postType === 'video') reward = 89;

    // Call C++ blockchain core to add content and mine block
    const contentType = postData.postType;
    const filename = file ? file.filename : '';
    const uploader = userId;
    const hash = postData.id ? postData.id.toString() : Date.now().toString();
    const args = ['add-content', contentType, filename, uploader, hash];
    let blockchainResult = '';
    try {
      blockchainResult = await callBlockchainCore(args);
    } catch (err) {
      throw new Error('Blockchain core error: ' + err);
    }
    return { ...postData, coinsEarned: reward, blockchainResult };
  }

  static async toggleLike(userId: string, postId: number) {
    // Placeholder for like logic
    // You can call blockchain core or manage likes in a DB if needed
    return { liked: true };
  }
}
