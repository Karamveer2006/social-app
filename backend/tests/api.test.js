import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

test.before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_token_12345';
  await connectDB();
});

test.after(async () => {
  await disconnectDB();
});

test('API Integration Suite: Auth, Posts, Likes, Comments, and Collection Rule', async (t) => {
  let authToken = '';
  let testUserId = '';
  let postId = '';

  await t.test('1. Health Check Endpoint', async () => {
    const res = await request(app).get('/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
  });

  await t.test('2. User Signup & Login Flow', async () => {
    const uniqueNum = Date.now();
    const signupData = {
      name: 'Test Tester',
      username: `tester_${uniqueNum}`,
      email: `tester_${uniqueNum}@example.com`,
      password: 'StrongPassword123!',
    };

    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send(signupData);

    assert.equal(signupRes.status, 201);
    assert.equal(signupRes.body.success, true);
    assert.ok(signupRes.body.data.token);
    assert.equal(signupRes.body.data.user.username, signupData.username);

    // Login with same credentials
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: signupData.email,
        password: signupData.password,
      });

    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.success, true);
    assert.ok(loginRes.body.data.token);
    authToken = loginRes.body.data.token;
    testUserId = loginRes.body.data.user._id;
  });

  await t.test('3. Post Creation (Text Only, Image Only, Both, and Validation)', async () => {
    // 3a. Reject empty text and empty image
    const emptyRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: '', imageUrl: '' });
    assert.equal(emptyRes.status, 400);

    // 3b. Text-only post
    const textPostRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Hello World from test suite!' });
    assert.equal(textPostRes.status, 201);
    assert.equal(textPostRes.body.data.post.content, 'Hello World from test suite!');
    assert.equal(textPostRes.body.data.post.imageUrl, '');
    postId = textPostRes.body.data.post._id;

    // 3c. Image-only post
    const imgPostRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ imageUrl: 'https://example.com/test-image.jpg' });
    assert.equal(imgPostRes.status, 201);
    assert.equal(imgPostRes.body.data.post.content, '');
    assert.equal(imgPostRes.body.data.post.imageUrl, 'https://example.com/test-image.jpg');

    // 3d. Both text and image
    const bothPostRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: 'Post with both text and photo',
        imageUrl: 'https://example.com/photo.png',
      });
    assert.equal(bothPostRes.status, 201);
  });

  await t.test('4. Public Feed & Pagination', async () => {
    const feedRes = await request(app).get('/api/posts?page=1&limit=5');
    assert.equal(feedRes.status, 200);
    assert.equal(feedRes.body.success, true);
    assert.ok(Array.isArray(feedRes.body.data.posts));
    assert.ok(feedRes.body.data.pagination);
    assert.equal(feedRes.body.data.pagination.page, 1);
  });

  await t.test('5. Like & Unlike Toggle with Username tracking', async () => {
    // Like post
    const likeRes = await request(app)
      .put(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(likeRes.status, 200);
    assert.equal(likeRes.body.data.isLikedByMe, true);
    assert.equal(likeRes.body.data.likesCount, 1);
    assert.ok(likeRes.body.data.likes.some((l) => l.userId.toString() === testUserId));

    // Check likes endpoint
    const getLikesRes = await request(app).get(`/api/posts/${postId}/likes`);
    assert.equal(getLikesRes.status, 200);
    assert.equal(getLikesRes.body.data.likesCount, 1);
    assert.ok(getLikesRes.body.data.likes.length > 0);

    // Unlike post (toggle)
    const unlikeRes = await request(app)
      .put(`/api/posts/${postId}/like`)
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(unlikeRes.status, 200);
    assert.equal(unlikeRes.body.data.isLikedByMe, false);
    assert.equal(unlikeRes.body.data.likesCount, 0);
  });

  await t.test('6. Comment Flow with Username tracking', async () => {
    const commentText = 'This is an awesome post!';
    const commentRes = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: commentText });

    assert.equal(commentRes.status, 201);
    assert.equal(commentRes.body.data.commentsCount, 1);
    assert.equal(commentRes.body.data.comment.text, commentText);
    assert.ok(commentRes.body.data.comment.username);
  });

  await t.test('7. Comment Reply Flow with replyTo tracking', async () => {
    const replyText = '@testuser Thanks for the comment!';
    const replyRes = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: replyText, replyTo: 'testuser' });

    assert.equal(replyRes.status, 201);
    assert.equal(replyRes.body.data.commentsCount, 2);
    assert.equal(replyRes.body.data.comment.replyTo, 'testuser');
    assert.equal(replyRes.body.data.comment.text, replyText);
  });

  await t.test('8. Update User Profile & Bio', async () => {
    const updatedBio = 'Full-stack software developer passionate about building scalable apps.';
    const updatedName = 'Test User Updated';

    const updateRes = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: updatedName,
        bio: updatedBio,
      });

    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.data.user.bio, updatedBio);
    assert.equal(updateRes.body.data.user.name, updatedName);
  });

  let secondUserId = '';
  await t.test('9. Follow / Unfollow System & Profile Lookup', async () => {
    // Create second user
    const signup2 = await request(app).post('/api/auth/signup').send({
      name: 'Second User',
      username: 'seconduser',
      email: 'second@example.com',
      password: 'password123',
    });
    assert.equal(signup2.status, 201);
    secondUserId = signup2.body.data.user._id;

    // Follow second user
    const followRes = await request(app)
      .put(`/api/users/${secondUserId}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(followRes.status, 200);
    assert.equal(followRes.body.data.isFollowing, true);
    assert.equal(followRes.body.data.followersCount, 1);

    // Get second user profile
    const profileRes = await request(app)
      .get('/api/users/seconduser')
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(profileRes.status, 200);
    assert.equal(profileRes.body.data.user.username, 'seconduser');
    assert.equal(profileRes.body.data.user.followersCount, 1);
    assert.equal(profileRes.body.data.user.isFollowing, true);

    // Unfollow second user
    const unfollowRes = await request(app)
      .put(`/api/users/${secondUserId}/follow`)
      .set('Authorization', `Bearer ${authToken}`);

    assert.equal(unfollowRes.status, 200);
    assert.equal(unfollowRes.body.data.isFollowing, false);
    assert.equal(unfollowRes.body.data.followersCount, 0);
  });

  await t.test('10. STRICT CONSTRAINT CHECK: Only 2 MongoDB Collections (users, posts)', async () => {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log('MongoDB Collections in Database:', collectionNames);

    // Check that only users and posts exist
    const nonSystemCollections = collectionNames.filter((name) => !name.startsWith('system.'));
    assert.equal(
      nonSystemCollections.length,
      2,
      `Expected exactly 2 collections (users and posts), but found: ${nonSystemCollections.join(', ')}`
    );
    assert.ok(nonSystemCollections.includes('users'));
    assert.ok(nonSystemCollections.includes('posts'));
  });

  await t.test('11. Cloudinary Module & Media Storage Verification', async () => {
    const { isCloudinaryConfigured, uploadMedia } = await import('../src/config/cloudinary.js');
    assert.equal(typeof isCloudinaryConfigured(), 'boolean');

    // Test fallback upload logic
    const mockFile = {
      filename: 'test-image.png',
      path: '/tmp/test-image.png',
      originalname: 'test-image.png',
      mimetype: 'image/png',
    };
    const uploadRes = await uploadMedia(mockFile, 'taskplanet/test');
    assert.ok(uploadRes.url);
    assert.ok(uploadRes.provider === 'local' || uploadRes.provider === 'cloudinary');

    // Test health check endpoint reports mediaStorage provider
    const healthRes = await request(app).get('/api/health');
    assert.equal(healthRes.status, 200);
    assert.ok(healthRes.body.mediaStorage);
    assert.ok(healthRes.body.mediaStorage.provider);
  });

  await t.test('12. User Profile Post Pagination & Meta', async () => {
    const profileRes = await request(app)
      .get('/api/users/tester_' + testUserId) // test fallback or username
      .query({ page: 1, limit: 2 });
    // Or query seconduser
    const secondUserRes = await request(app)
      .get('/api/users/seconduser')
      .query({ page: 1, limit: 2 });
    assert.equal(secondUserRes.status, 200);
    assert.ok(secondUserRes.body.data.pagination);
    assert.equal(secondUserRes.body.data.pagination.page, 1);
    assert.equal(secondUserRes.body.data.pagination.limit, 2);
  });

  await t.test('13. Validation Middleware (Bad Email, Short Password, Empty Comment)', async () => {
    // Bad email rejection
    const badEmailRes = await request(app).post('/api/auth/signup').send({
      name: 'Bad Email User',
      username: 'bademailuser',
      email: 'not-an-email',
      password: 'password123',
    });
    assert.equal(badEmailRes.status, 400);
    assert.equal(badEmailRes.body.success, false);

    // Short password rejection
    const shortPassRes = await request(app).post('/api/auth/signup').send({
      name: 'Short Pass User',
      username: 'shortpassuser',
      email: 'shortpass@example.com',
      password: '123',
    });
    assert.equal(shortPassRes.status, 400);
    assert.equal(shortPassRes.body.success, false);

    // Empty comment rejection
    const emptyCommentRes = await request(app)
      .post(`/api/posts/${postId}/comment`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ text: '   ' });
    assert.equal(emptyCommentRes.status, 400);
    assert.equal(emptyCommentRes.body.success, false);
  });
});

