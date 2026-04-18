<?php
/**
 * DokuWiki Plugin flashcards (Syntax Component)
 *
 * @license    GPL 2 (http://www.gnu.org/licenses/gpl.html)
 * author: Jakub Pelc
 */

// Must be run within DokuWiki
if (!defined('DOKU_INC')) die();

require_once(DOKU_INC . 'inc/parserutils.php');

class syntax_plugin_flashcards extends DokuWiki_Syntax_Plugin {

    public function getType() {
        return 'container';
    }

    public function getPType() {
        return 'block';
    }

    public function getAllowedTypes() {
        return ['container', 'formatting', 'substition', 'protected', 'disabled', 'paragraphs'];
    }

    public function getSort() {
        return 158;
    }

    public function connectTo($mode) {
        $this->Lexer->addSpecialPattern('<flashcards.*?>.*?</flashcards>', $mode, 'plugin_flashcards');
    }

    public function handle($match, $state, $pos, Doku_Handler $handler) {
        $match = trim(substr($match, 12, -13)); // Strip <flashcards> tags

        // Parse optional attributes
        preg_match('/heading="(.*?)"/', $match, $headingMatch);
        preg_match('/subtext="(.*?)"/', $match, $subtextMatch);
        preg_match('/skiptext="(.*?)"/', $match, $skipTextMatch);
        preg_match('/nexttext="(.*?)"/', $match, $nextTextMatch);
        preg_match('/defaultnum="(\d+)"/', $match, $defaultNumMatch);

        $heading = $headingMatch[1] ?? 'Flashcard Quiz';
        $subtext = $subtextMatch[1] ?? 'Answer the following questions:';
        $skipText = $skipTextMatch[1] ?? 'Skip';
        $nextText = $nextTextMatch[1] ?? 'Next';
        $defaultNum = $defaultNumMatch[1] ?? 5; // Default to 5 if not provided

        // Parse the content within the <questions></questions> block
        if (preg_match('/<questions>(.*?)<\/questions>/s', $match, $contentMatch)) {
            $content = trim($contentMatch[1]);
        } else {
            return [
                'heading' => $heading,
                'subtext' => $subtext,
                'skipText' => $skipText,
                'nextText' => $nextText,
                'defaultNum' => $defaultNum,
                'questions' => [], // No valid content found
            ];
        }

        // Parse questions and answers using --- as delimiter
        $questions = [];
        foreach (preg_split('/---\n/', $content) as $block) {
            $lines = explode("\n", trim($block));
            $questionLines = [];
            $answerLines = [];
            $inAnswers = false;

            foreach ($lines as $rawLine) {
                if (trim($rawLine) === '') {
                    continue;
                }

                if (!$inAnswers && preg_match('/^\s*(?:-\s*)?\*/', $rawLine)) {
                    $inAnswers = true;
                }

                if (!$inAnswers && preg_match('/^\s*-\s*/', $rawLine)) {
                    $inAnswers = true;
                }

                if ($inAnswers) {
                    $answerLines[] = $rawLine;
                } else {
                    $questionLines[] = $rawLine;
                }
            }

            $question = trim(implode("\n", $questionLines));

            if (empty($question)) {
                continue; // Skip empty question blocks
            }

            $answers = [];
            $correctAnswerIndex = null;

            foreach ($answerLines as $line) {
                $line = trim($line);

                if ($line === '') {
                    continue;
                }

                if (preg_match('/^\s*(?:-\s*)?\*/', $line)) {
                    $correctAnswerIndex = count($answers);
                    $line = preg_replace('/^\s*(?:-\s*)?\*\s*/', '', $line); // Remove the correct marker
                } else {
                    $line = preg_replace('/^\s*-\s*/', '', $line);
                }
                $answers[] = trim($line);
            }

            if (empty($answers) || $correctAnswerIndex === null) {
                continue; // Skip questions without valid answers or no correct answer
            }

            $questions[] = [
                'question' => trim($question),
                'answers' => $answers,
                'correct' => $correctAnswerIndex,
            ];
        }

        return [
            'heading' => $heading,
            'subtext' => $subtext,
            'skipText' => $skipText,
            'nextText' => $nextText,
            'defaultNum' => $defaultNum,
            'questions' => $questions,
        ];
    }

    public function render($mode, Doku_Renderer $renderer, $data) {
        if ($mode !== 'xhtml') return false;

        $heading = htmlspecialchars($data['heading']);
        $subtext = htmlspecialchars($data['subtext']);
        $skipText = htmlspecialchars($data['skipText']);
        $nextText = htmlspecialchars($data['nextText']);
        $defaultNum = htmlspecialchars($data['defaultNum']);
        $questionsForClient = [];

        foreach ($data['questions'] as $question) {
            $questionHtml = '';
            $answerHtml = [];

            if (function_exists('p_get_instructions') && function_exists('p_render')) {
                $instructions = p_get_instructions($question['question']);
                $info = [];

                if (!empty($instructions)) {
                    $questionHtml = p_render('xhtml', $instructions, $info);
                }

                foreach ($question['answers'] as $answer) {
                    $answerInstructions = p_get_instructions($answer);
                    $answerInfo = [];

                    if (!empty($answerInstructions)) {
                        $answerHtml[] = p_render('xhtml', $answerInstructions, $answerInfo);
                    } else {
                        $answerHtml[] = hsc($answer);
                    }
                }
            } else {
                $questionHtml = nl2br(hsc($question['question']));

                foreach ($question['answers'] as $answer) {
                    $answerHtml[] = nl2br(hsc($answer));
                }
            }

            $question['questionHtml'] = $questionHtml;
            $question['answerHtml'] = $answerHtml;
            $questionsForClient[] = $question;
        }

        $questions = json_encode($questionsForClient, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);

        $renderer->doc .= "<div id='flashcards-container'>
            <h1>{$heading}</h1>
            <p>{$subtext}</p>
            <div id='app-container'>
                <div id='welcome-screen'>
                    <input type='number' id='question-count-input' placeholder='Enter number of questions' min='1' value='{$defaultNum}'>
                    <button class='button' id='start-button'>Start Test</button>
                </div>
                <div id='test-container' style='display: none;'>
                    <div class='question'>
                        <p id='question-text'></p>
                        <div class='answers' id='answers-container'></div>
                        <button id='skip-button' class='button'>{$skipText}</button>
                        <button id='next-button' class='button' style='display: none;'>{$nextText}</button>
                    </div>
                </div>
                <div id='summary-container' style='display: none;'>
					<div id='detailed-summary'></div>
				</div>
            </div>
        </div>
        <link rel='stylesheet' href='" . DOKU_BASE . "lib/plugins/flashcards/style.css'>
        <script>
            const originalQuestions = {$questions};
        </script>
        <script src='" . DOKU_BASE . "lib/plugins/flashcards/script.js'></script>";

        return true;
    }
}
