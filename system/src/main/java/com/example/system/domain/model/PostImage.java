package com.example.system.domain.model;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class PostImage {

    private MultipartFile file;

}
