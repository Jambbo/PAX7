package com.example.system.repository;

import com.example.system.domain.model.Comment;
import com.example.system.domain.model.Post;
import com.example.system.domain.model.User;
import com.example.system.utils.UserUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.liquibase.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
public class CommentRepositoryTest {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    public void setUp() {
        commentRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Test find by post Id ordered by created at desc")
    public void givenComments_whenFindByPostId_thenReturnsOrderedComments() throws InterruptedException {
        User author = UserUtils.getJohnDoe();
        userRepository.save(author);

        Post post = Post.builder().text("Post here").author(author).build();
        postRepository.save(post);

        Comment olderComment = Comment.builder().content("First!").post(post).author(author).build();
        commentRepository.save(olderComment);

        Thread.sleep(100);

        Comment newerComment = Comment.builder().content("Second!").post(post).author(author).build();
        commentRepository.save(newerComment);

        List<Comment> found = commentRepository.findByPostIdOrderByCreatedAtDesc(post.getId());
        assertThat(found).hasSize(2);
        assertThat(found.getFirst().getContent()).isEqualTo("Second!");
        assertThat(found.get(1).getContent()).isEqualTo("First!");
    }

    @Test
    @DisplayName("Test exists by Id and author Id")
    public void givenComment_whenExistsByIdAndAuthorId_thenReturnsTrue() {
        User author = UserUtils.getJohnDoe();
        userRepository.save(author);

        Post post = Post.builder().text("Post").author(author).build();
        postRepository.save(post);

        Comment comment = Comment.builder().content("Hi").post(post).author(author).build();
        commentRepository.save(comment);

        assertThat(commentRepository.existsByIdAndAuthorId(comment.getId(), author.getId())).isTrue();
        assertThat(commentRepository.existsByIdAndAuthorId(comment.getId(), "wrong_id")).isFalse();
    }
}
