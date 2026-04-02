package com.example.system.service.post;

import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.repository.PostRepository;
import com.example.system.repository.UserRepository;
import com.example.system.service.user.UserService;
import com.example.system.service.notification.NotificationService;
import com.example.system.domain.model.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final UserService userService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public Post createPost(Post post, String ownerId) {
        // Initialize views and likes to 0 if null
        if (post.getViews() == null) {
            post.setViews(0L);
        }
        if (post.getLikes() == null) {
            post.setLikes(0L);
        }

        post.setAuthor(userService.getUserById(ownerId));

        return postRepository.save(post);
    }

    @Override
    @Transactional(readOnly = true)
    public Post getPostById(Long id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getAllPosts() {
        return postRepository.findAllVisiblePosts();
    }

    @Override
    @Transactional
    public Post updatePost(Long postId, Post post) {
        Post existingPost = getPostById(postId);

        if (post.getText() != null) {
            existingPost.setText(post.getText());
        }
        if (post.getGroup() != null) {
            existingPost.setGroup(post.getGroup());
        }
        if (post.getImages() != null) {
            existingPost.setImages(post.getImages());
        }

        return postRepository.save(existingPost);
    }

    @Override
    @Transactional
    public void deletePost(Long id) {
        Post post = getPostById(id);
        postRepository.delete(post);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getPostsByAuthorId(String authorId) {
        return postRepository.findByAuthorIdOrderByCreatedAtDesc(authorId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getPostsByGroupId(Long groupId) {
        return postRepository.findByGroupIdOrderByCreatedAtDesc(groupId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getTopPostsByViews() {
        return postRepository.findTopByViews();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Post> getTopPostsByLikes() {
        return postRepository.findTopByLikes();
    }

    @Override
    @Transactional
    public Post incrementViews(Long id) {
        //TODO implement batch processing instead of having a separate request for each view
        Post post = getPostById(id);
        post.setViews(post.getViews() != null ? post.getViews() + 1 : 1L);
        return postRepository.save(post);
    }

    @Override
    @Transactional
    public Post incrementLikesAndAddToUser(Long postId, String userId) {
        Post post = getPostById(postId);
        User user = userService.getUserById(userId);
        Set<Post> likedPosts = user.getLikedPosts();
        if(!likedPosts.contains(post)){
            post.setLikes(post.getLikes() != null ? post.getLikes() + 1 : 1L);
            likedPosts.add(post);

            if (post.getAuthor() != null) {
                notificationService.createNotification(
                        post.getAuthor().getId(),
                        userId,
                        NotificationType.LIKE_POST,
                        postId.toString()
                );
            }
        }else{
            long currentLikes = post.getLikes() != null ? post.getLikes() : 0L;
            post.setLikes(Math.max(0L, currentLikes - 1));
            likedPosts.remove(post);
        }
        user.setLikedPosts(likedPosts);
        userRepository.save(user);
        return postRepository.save(post);
    }



}