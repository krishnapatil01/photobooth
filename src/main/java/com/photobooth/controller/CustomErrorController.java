package com.photobooth.controller;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        Object exception = request.getAttribute(RequestDispatcher.ERROR_EXCEPTION);

        int statusCode = (status != null) ? Integer.parseInt(status.toString()) : 500;
        model.addAttribute("statusCode", statusCode);
        model.addAttribute("errorMessage",
                message != null && !message.toString().isEmpty() ? message.toString()
                        : "An unexpected error occurred.");

        // Log the full exception for debugging
        if (exception instanceof Throwable t) {
            model.addAttribute("exDetail", t.getMessage());
            t.printStackTrace();
        }

        if (statusCode == HttpStatus.NOT_FOUND.value()) {
            model.addAttribute("errorTitle", "PAGE NOT FOUND");
        } else if (statusCode == HttpStatus.FORBIDDEN.value()) {
            model.addAttribute("errorTitle", "ACCESS DENIED");
        } else {
            model.addAttribute("errorTitle", "SOMETHING WENT WRONG");
        }

        return "error";
    }
}
