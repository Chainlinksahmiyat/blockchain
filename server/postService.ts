// Service for post-related business logic
import { callBlockchainCore } from './blockchain';

export class PostService {
  static async createPost(postData: any, file: any, userId: string) {
    // Call C++ blockchain core to add content and mine block
    const contentType = postData.postType;
    const filename = file ? file.filename : '';
    const uploader = userId;
    const hash = postData.id ? postData.id.toString() : Date.now().toString();
    const args = ['add-content', contentType, filename, uploader, hash];
    let blockchainResult = '';
    let reward = 0.0001;
    try {
      blockchainResult = await callBlockchainCore(args);
      // Try to parse reward from blockchainResult if possible
      // Example: if blockchainResult contains 'Reward: 0.5', extract it
      const match = blockchainResult.match(/Reward:\s*([0-9.]+)/);
      if (match) reward = parseFloat(match[1]);
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
