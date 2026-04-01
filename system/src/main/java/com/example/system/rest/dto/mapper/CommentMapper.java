package com.example.system.rest.dto.mapper;

import com.example.system.domain.model.Comment;
import com.example.system.rest.dto.comment.CommentReadResponseDto;
import com.example.system.rest.dto.comment.CommentWriteDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CommentMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "post", ignore = true)
    @Mapping(target = "author", ignore = true)
    @Mapping(target = "likes", ignore = true)
    @Mapping(target = "dislikes", ignore = true)
    @Mapping(target = "isEdited", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Comment toEntity(CommentWriteDto dto);

    @Mapping(target = "postId", source = "post.id")
    @Mapping(target = "authorId", source = "author.id")
    @Mapping(target = "authorUsername", source = "author.username")
    CommentReadResponseDto toDto(Comment comment);

    List<CommentReadResponseDto> toDto(List<Comment> comments);
}

