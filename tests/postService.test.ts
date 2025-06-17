// Example Jest test for the PostService
import { PostService } from '../server/postService';

describe('PostService', () => {
  it('should create a post and return result', async () => {
    const postData = { postType: 'meme', id: 1 };
    const file = { filename: 'test.jpg' } as any;
    const userId = 'user123';
    // This will call the blockchain core, so in real tests, mock callBlockchainCore
    const result = await PostService.createPost(postData, file, userId);
    expect(result).toHaveProperty('coinsEarned');
    expect(result).toHaveProperty('blockchainResult');
  });
});
